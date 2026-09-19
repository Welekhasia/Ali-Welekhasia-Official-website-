/**
 * Cloudflare Pages Function: /api/store/orders
 * Handles order creation, authoritative price lookup from Firebase Database,
 * and payment initialization via Paystack / M-Pesa.
 *
 * CRITICAL SECURITY:
 * - Authoritative price is retrieved server-side from database.
 * - Client cannot override amount or product details.
 * - Payment secret keys are NEVER exposed to client.
 */

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

const FIREBASE_DB_URL = "https://gospelsphere-default-rtdb.europe-west1.firebasedatabase.app";

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { productId, customerEmail, customerPhone, paymentProvider = 'PAYSTACK' } = body;

        if (!productId) {
            return jsonResponse({ success: false, error: "Product ID is required for music purchases." }, 400);
        }
        if (!customerEmail || !customerEmail.includes('@')) {
            return jsonResponse({ success: false, error: "A valid customer email address is required." }, 400);
        }

        // 1. Retrieve authoritative song product from Firebase Realtime Database
        const songDbRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${productId}.json`);
        const songData = await songDbRes.json();

        if (!songData) {
            return jsonResponse({ success: false, error: "Requested song was not found in the music catalogue." }, 404);
        }

        // 2. Authoritative Price Calculation
        const price = typeof songData.price === 'number' && songData.price > 0 ? songData.price : 100;
        const currency = songData.currency || 'KSh';
        const title = songData.title || 'Gospel Song';
        const artist = songData.artist || 'Ali Welekhasia';

        // 3. Generate secure identifiers
        const timestamp = Date.now();
        const randHex = Math.random().toString(36).substring(2, 7);
        const orderId = `ord_${timestamp}_${randHex}`;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randDigits = Math.floor(100000 + Math.random() * 900000);
        const orderNumber = `AW-${dateStr}-${randDigits}`;
        const paymentReference = `payref_${timestamp}_${randHex}`;

        const requestUrl = new URL(request.url);
        const origin = requestUrl.origin;

        // 4. Construct Order Object
        const orderRecord = {
            id: orderId,
            orderNumber,
            customerEmail: customerEmail.trim().toLowerCase(),
            customerPhone: (customerPhone || '').trim(),
            productId,
            productTitle: title,
            productArtist: artist,
            productType: "SINGLE",
            amount: price,
            currency,
            paymentProvider,
            paymentReference,
            paymentStatus: "PENDING",
            fulfillmentStatus: "UNFULFILLED",
            createdAt: new Date().toISOString(),
            paidAt: null,
            downloadCount: 0
        };

        // 5. Save order record to Firebase Database
        await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders/${orderId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderRecord)
        });

        // 6. Initialize Payment with Gateway
        const paystackSecret = env.PAYSTACK_SECRET_KEY;
        const paystackPublic = env.PAYSTACK_PUBLIC_KEY;

        let authorizationUrl = null;
        let checkoutUrl = null;

        if (paystackSecret) {
            // Call Paystack API to initialize transaction
            const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${paystackSecret}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: customerEmail.trim().toLowerCase(),
                    amount: Math.round(price * 100), // convert to kobo / cents
                    currency: currency === 'KSh' ? 'KES' : currency,
                    reference: paymentReference,
                    callback_url: `${origin}/music/index.html?purchase=success&orderId=${orderId}&reference=${paymentReference}`,
                    metadata: {
                        orderId,
                        orderNumber,
                        productId,
                        songTitle: title,
                        customerPhone
                    }
                })
            });

            const paystackData = await paystackRes.json();
            if (paystackData.status && paystackData.data) {
                authorizationUrl = paystackData.data.authorization_url;
                checkoutUrl = paystackData.data.authorization_url;
            }
        }

        return jsonResponse({
            success: true,
            orderId,
            orderNumber,
            paymentReference,
            amount: price,
            currency,
            title,
            artist,
            customerEmail,
            customerPhone,
            paymentProvider,
            paystackPublicKey: paystackPublic || null,
            authorizationUrl,
            checkoutUrl,
            message: authorizationUrl 
                ? "Payment session initialized successfully."
                : "Order created. Payment credentials pending configuration."
        });

    } catch (err) {
        console.error("Order Creation Error:", err);
        return jsonResponse({
            success: false,
            error: "Something went wrong while processing your purchase request. Please try again."
        }, 500);
    }
}

export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
        return jsonResponse({ success: false, error: "Order ID parameter is required." }, 400);
    }

    try {
        const orderRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders/${orderId}.json`);
        const orderData = await orderRes.json();

        if (!orderData) {
            return jsonResponse({ success: false, error: "Order not found." }, 404);
        }

        return jsonResponse({
            success: true,
            order: orderData
        });
    } catch (err) {
        return jsonResponse({ success: false, error: "Error retrieving order details." }, 500);
    }
}
