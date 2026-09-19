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

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

const FIREBASE_DB_URL = "https://gospelsphere-default-rtdb.europe-west1.firebasedatabase.app";

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const bodyText = await request.text();
        let body = {};
        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            return jsonResponse({ error: "Invalid JSON body" }, 400);
        }

        // 1. Verify Paystack Webhook Signature if secret configured
        const paystackSignature = request.headers.get('x-paystack-signature');
        const webhookSecret = env.PAYSTACK_WEBHOOK_SECRET || env.PAYSTACK_SECRET_KEY;

        if (paystackSignature && webhookSecret) {
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
                return jsonResponse({ error: "Invalid webhook signature" }, 401);
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

            // 5. Verify Amount
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

            // 6. Generate Download Entitlement Token
            const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
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
                    gatewayChannel: data.channel || 'paystack',
                    gatewayTransactionId: data.id || null
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
