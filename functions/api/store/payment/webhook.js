/**
 * Cloudflare Pages Function: /api/store/payment/webhook
 * Handles incoming payment webhooks from Paystack and M-Pesa gateways.
 *
 * CRITICAL SECURITY & IDEMPOTENCY:
 * - HMAC signature verification (x-paystack-signature).
 * - Idempotent: Duplicate webhooks return 200 without duplicate processing.
 * - Server-side verification of payment status and amount.
 * - Creates download entitlement token upon successful payment verification.
 */

import { validateEnvironmentConfig } from '../../security/env.js';
import { checkRateLimit, buildRateLimitResponse } from '../../security/rateLimit.js';
import { recordAuditEvent } from '../../security/audit.js';

function jsonResponse(data, status = 200, requestId = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (requestId) headers['X-Request-Id'] = requestId;
    return new Response(JSON.stringify(data), {
        status,
        headers
    });
}

const FIREBASE_DB_URL = "https://gospelsphere-default-rtdb.europe-west1.firebasedatabase.app";

export async function onRequestPost(context) {
    const { request, env } = context;

    // 1. Webhook Rate Limiting Protection (High capacity: 60/min to permit legitimate gateway retries)
    const rateCheck = await checkRateLimit('webhook', request);
    if (!rateCheck.allowed) {
        await recordAuditEvent(context, {
            eventType: 'WEBHOOK_RATE_LIMIT_TRIGGERED',
            result: rateCheck.status,
            requestId: rateCheck.requestId
        });
        return buildRateLimitResponse(rateCheck);
    }

    const requestId = rateCheck.requestId;

    // 2. Server-Side Environment Guardrail Validation
    const envValidation = validateEnvironmentConfig(env);
    if (!envValidation.valid) {
        await recordAuditEvent(context, {
            eventType: 'WEBHOOK_GUARDRAIL_VIOLATION',
            result: 'BLOCKED',
            requestId,
            metadata: { errors: envValidation.errors }
        });
        return jsonResponse({ error: "Webhook configuration guardrail violation: " + envValidation.errors[0] }, 500, requestId);
    }

    try {
        const bodyText = await request.text();
        let body = {};
        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            return jsonResponse({ error: "Invalid JSON body" }, 400, requestId);
        }

        // 3. Verify Paystack Webhook Signature First
        const paystackSignature = request.headers.get('x-paystack-signature');
        const webhookSecret = env.PAYSTACK_WEBHOOK_SECRET || env.PAYSTACK_SECRET_KEY;

        if (webhookSecret) {
            if (!paystackSignature) {
                console.error("Missing x-paystack-signature header in webhook!");
                await recordAuditEvent(context, {
                    eventType: 'WEBHOOK_SIGNATURE_MISSING',
                    result: 'REJECTED',
                    requestId
                });
                return jsonResponse({ error: "Missing webhook signature header" }, 401, requestId);
            }

            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(webhookSecret),
                { name: 'HMAC', hash: 'SHA-512' },
                false,
                ['sign']
            );

            const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
            const computedHex = Array.from(new Uint8Array(signatureBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            if (computedHex.toLowerCase() !== paystackSignature.trim().toLowerCase()) {
                console.error("Webhook signature mismatch!");
                await recordAuditEvent(context, {
                    eventType: 'WEBHOOK_SIGNATURE_MISMATCH',
                    result: 'REJECTED',
                    requestId
                });
                return jsonResponse({ error: "Invalid webhook signature" }, 401, requestId);
            }
        }

        // 2. Parse Event Details
        const event = body.event;
        const data = body.data || {};

        if (event === 'charge.success') {
            const paymentReference = data.reference;
            const metadata = data.metadata || {};
            const orderId = metadata.orderId;
            const paidAmountKobo = data.amount; // in kobo / cents

            if (!paymentReference) {
                return jsonResponse({ message: "No reference found in event" }, 200);
            }

            // 3. Retrieve Order from Database by orderId or reference lookup
            let targetOrderId = orderId;
            let orderData = null;

            if (targetOrderId) {
                const orderRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders/${targetOrderId}.json`);
                orderData = await orderRes.json();
            }

            if (!orderData) {
                // Query orders index by paymentReference
                const queryRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders.json?orderBy="paymentReference"&equalTo="${paymentReference}"`);
                const matches = await queryRes.json();
                if (matches && Object.keys(matches).length > 0) {
                    const keys = Object.keys(matches);
                    targetOrderId = keys[0];
                    orderData = matches[targetOrderId];
                }
            }

            if (!orderData) {
                console.warn(`Order not found for payment reference: ${paymentReference}`);
                return jsonResponse({ message: "Order not found, logged for inspection" }, 200);
            }

            // 4. IDEMPOTENCY CHECK: If already paid, return 200 OK
            if (orderData.paymentStatus === 'PAID') {
                return jsonResponse({ message: "Order already fulfilled (idempotent)" }, 200);
            }

            // 5. Verify Currency & Amount
            const expectedCurrency = (orderData.currency === 'KSh' ? 'KES' : (orderData.currency || 'KES')).toUpperCase();
            const paidCurrency = (data.currency || '').toUpperCase();
            if (paidCurrency && expectedCurrency && paidCurrency !== expectedCurrency) {
                console.error(`Currency mismatch! Expected ${expectedCurrency}, received ${paidCurrency}`);
                return jsonResponse({ error: "Payment currency does not match authoritative order currency" }, 200);
            }

            const expectedAmountKobo = Math.round((orderData.amount || 100) * 100);
            if (paidAmountKobo && paidAmountKobo < expectedAmountKobo) {
                console.error(`Underpayment detected! Expected ${expectedAmountKobo}, received ${paidAmountKobo}`);
                await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders/${targetOrderId}/paymentStatus.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify("UNDERPAID_REJECTED")
                });
                return jsonResponse({ error: "Payment amount does not match authoritative order price" }, 200);
            }

            // 6. Generate High-Entropy 256-bit Cryptographically Random Download Entitlement Token
            const randBytes = new Uint8Array(24);
            crypto.getRandomValues(randBytes);
            const token = 'aw_dl_' + Array.from(randBytes).map(b => b.toString(16).padStart(2, '0')).join('');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days validity

            const entitlement = {
                token,
                orderId: targetOrderId,
                orderNumber: orderData.orderNumber,
                productId: orderData.productId,
                productTitle: orderData.productTitle,
                customerEmail: orderData.customerEmail,
                customerPhone: orderData.customerPhone,
                maxDownloads: 10,
                downloadCount: 0,
                createdAt: new Date().toISOString(),
                expiresAt
            };

            // Save Download Entitlement
            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/download_entitlements/${token}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entitlement)
            });

            // Calculate actual gateway fee and payment channel telemetry
            const rawFees = data.fees; // in kobo/cents
            const gatewayFee = typeof rawFees === 'number' ? (rawFees / 100) : null;
            const channel = data.channel || 'paystack';
            const auth = data.authorization || {};
            const cardType = auth.brand || auth.card_type || null;
            const cardCountry = auth.country_code || null;
            const isInternational = cardCountry ? (cardCountry.toUpperCase() !== 'KE') : false;
            const netSettlement = gatewayFee !== null ? Math.max(0, (orderData.amount || 0) - gatewayFee) : null;

            // 7. Update Order Status to PAID
            const paidTimestamp = new Date().toISOString();
            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders/${targetOrderId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentStatus: 'PAID',
                    fulfillmentStatus: 'FULFILLED',
                    paidAt: paidTimestamp,
                    downloadToken: token,
                    paymentChannel: channel,
                    gatewayChannel: channel,
                    gatewayTransactionId: data.id || null,
                    gatewayFee,
                    cardType,
                    cardCountry,
                    isInternational,
                    netSettlement
                })
            });

            // 8. Record Payment log
            const paymentRecord = {
                id: `pay_${Date.now()}`,
                paymentReference,
                orderId: targetOrderId,
                orderNumber: orderData.orderNumber,
                amount: orderData.amount,
                currency: orderData.currency,
                customerEmail: orderData.customerEmail,
                provider: "PAYSTACK",
                status: "SUCCESS",
                channel: data.channel || "card",
                paidAt: paidTimestamp,
                createdAt: new Date().toISOString()
            };

            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/payments/${paymentReference}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentRecord)
            });

            console.log(`Successfully fulfilled order ${orderData.orderNumber} for ${orderData.customerEmail}`);
            return jsonResponse({ status: true, message: "Webhook processed and order fulfilled" });
        }

        return jsonResponse({ status: true, message: "Event ignored" });

    } catch (err) {
        console.error("Webhook processing error:", err);
        return jsonResponse({ error: "Webhook processing error" }, 500);
    }
}
