/**
 * Cloudflare Pages Function: /api/store/payment/verify
 * Server-side payment verification endpoint.
 * Called by frontend post-checkout to verify transaction status directly with Paystack API
 * and retrieve/create the authorized download entitlement.
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

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const reference = url.searchParams.get('reference');
    const orderId = url.searchParams.get('orderId');

    if (!orderId && !reference) {
        return jsonResponse({ success: false, error: "Order ID or Payment Reference is required." }, 400);
    }

    try {
        // 1. Retrieve order record from Firebase Realtime Database
        let orderData = null;
        let targetOrderId = orderId;

        if (targetOrderId) {
            const orderRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders/${targetOrderId}.json`);
            orderData = await orderRes.json();
        }

        if (!orderData && reference) {
            const queryRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders.json?orderBy="paymentReference"&equalTo="${reference}"`);
            const matches = await queryRes.json();
            if (matches && Object.keys(matches).length > 0) {
                targetOrderId = Object.keys(matches)[0];
                orderData = matches[targetOrderId];
            }
        }

        if (!orderData) {
            return jsonResponse({ success: false, error: "Order record not found." }, 404);
        }

        // 2. If order is already verified and marked PAID
        if (orderData.paymentStatus === 'PAID' && orderData.downloadToken) {
            // Retrieve song product details
            const songRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${orderData.productId}.json`);
            const song = await songRes.json() || {};

            return jsonResponse({
                success: true,
                status: "PAID",
                order: orderData,
                downloadToken: orderData.downloadToken,
                song: {
                    id: orderData.productId,
                    title: orderData.productTitle,
                    artist: orderData.productArtist,
                    artworkUrl: song.artworkUrl || '../hero.jpg'
                }
            });
        }

        // 3. Otherwise verify directly with Paystack API if reference & secret key exist
        const paystackSecret = env.PAYSTACK_SECRET_KEY;
        const targetRef = reference || orderData.paymentReference;

        if (paystackSecret && targetRef) {
            const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(targetRef)}`, {
                headers: {
                    'Authorization': `Bearer ${paystackSecret}`,
                    'Content-Type': 'application/json'
                }
            });

            const verifyData = await verifyRes.json();

            if (verifyData.status && verifyData.data) {
                const txStatus = verifyData.data.status; // 'success', 'failed', 'abandoned'
                const paidAmountKobo = verifyData.data.amount;

                if (txStatus === 'success') {
                    // Check amount match
                    const expectedAmountKobo = Math.round((orderData.amount || 100) * 100);
                    if (paidAmountKobo < expectedAmountKobo) {
                        return jsonResponse({
                            success: false,
                            status: "AMOUNT_MISMATCH",
                            error: "Payment verification failed due to amount mismatch."
                        }, 400);
                    }

                    // Fulfill order: generate entitlement
                    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
                    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

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

                    await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/download_entitlements/${token}.json`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(entitlement)
                    });

                    const paidTimestamp = new Date().toISOString();
                    await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders/${targetOrderId}.json`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paymentStatus: 'PAID',
                            fulfillmentStatus: 'FULFILLED',
                            paidAt: paidTimestamp,
                            downloadToken: token,
                            gatewayTransactionId: verifyData.data.id || null
                        })
                    });

                    orderData.paymentStatus = 'PAID';
                    orderData.fulfillmentStatus = 'FULFILLED';
                    orderData.paidAt = paidTimestamp;
                    orderData.downloadToken = token;

                    const songRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${orderData.productId}.json`);
                    const song = await songRes.json() || {};

                    return jsonResponse({
                        success: true,
                        status: "PAID",
                        order: orderData,
                        downloadToken: token,
                        song: {
                            id: orderData.productId,
                            title: orderData.productTitle,
                            artist: orderData.productArtist,
                            artworkUrl: song.artworkUrl || '../hero.jpg'
                        }
                    });
                } else if (txStatus === 'failed' || txStatus === 'abandoned') {
                    await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders/${targetOrderId}/paymentStatus.json`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(txStatus.toUpperCase())
                    });

                    return jsonResponse({
                        success: false,
                        status: txStatus.toUpperCase(),
                        message: `Payment was ${txStatus}. No download entitlement created.`
                    });
                }
            }
        }

        // Return current order status if gateway verification not performed or pending
        return jsonResponse({
            success: orderData.paymentStatus === 'PAID',
            status: orderData.paymentStatus || 'PENDING',
            order: orderData,
            message: orderData.paymentStatus === 'PAID' ? "Order paid" : "Payment verification is pending."
        });

    } catch (err) {
        console.error("Payment Verification Error:", err);
        return jsonResponse({
            success: false,
            error: "Something went wrong during payment verification."
        }, 500);
    }
}
