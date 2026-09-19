/**
 * Cloudflare Pages Function: /api/store/purchases
 * Customer Purchase History & Order Lookup endpoint.
 * Allows customers to retrieve their past song purchases and active download links
 * via passwordless lookup using their Email address or Order Number.
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
    const { request } = context;
    const url = new URL(request.url);
    const query = (url.searchParams.get('query') || url.searchParams.get('email') || '').trim().toLowerCase();

    if (!query) {
        return jsonResponse({ success: false, error: "Please enter an Email address, Phone number, or Order Number to search." }, 400);
    }

    try {
        const ordersRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders.json`);
        const allOrders = await ordersRes.json();

        if (!allOrders) {
            return jsonResponse({ success: true, count: 0, purchases: [] });
        }

        const matches = Object.values(allOrders).filter(ord => {
            if (!ord) return false;
            const email = (ord.customerEmail || '').toLowerCase();
            const phone = (ord.customerPhone || '').toLowerCase();
            const orderNum = (ord.orderNumber || '').toLowerCase();
            const orderId = (ord.id || '').toLowerCase();

            return email.includes(query) || phone.includes(query) || orderNum.includes(query) || orderId === query;
        });

        // Filter paid purchases and format output
        const purchases = matches
            .filter(ord => ord.paymentStatus === 'PAID')
            .map(ord => ({
                orderId: ord.id,
                orderNumber: ord.orderNumber,
                productId: ord.productId,
                productTitle: ord.productTitle,
                productArtist: ord.productArtist || 'Ali Welekhasia',
                amount: ord.amount,
                currency: ord.currency || 'KSh',
                paymentStatus: ord.paymentStatus,
                paidAt: ord.paidAt || ord.createdAt,
                downloadToken: ord.downloadToken,
                downloadUrl: ord.downloadToken ? `/api/store/download?token=${ord.downloadToken}` : null
            }));

        return jsonResponse({
            success: true,
            count: purchases.length,
            purchases
        });

    } catch (err) {
        console.error("Purchases Lookup Error:", err);
        return jsonResponse({ success: false, error: "Error retrieving purchase history." }, 500);
    }
}
