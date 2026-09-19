/**
 * Cloudflare Pages Function: /api/store/products
 * Authoritative Server-Side Product Management & Publishing Validation API.
 *
 * Capabilities:
 * - Server-side validation of music products before publishing
 * - Enforcement of required assets (Title, Artist, Artwork, Public Preview Audio, Private Master Audio, Price, Currency)
 * - Safe status transitions (DRAFT, PUBLISHED, UNPUBLISHED, ARCHIVED)
 * - Deletion protection for products with customer purchase history (enforces ARCHIVE)
 * - Audit logging for all administrative product changes
 */

const FIREBASE_DB_URL = "https://gospelsphere-default-rtdb.europe-west1.firebasedatabase.app";

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Role, X-Admin-Email'
        }
    });
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Role, X-Admin-Email'
        }
    });
}

/**
 * Server-Side Publishing Validator
 * Strictly verifies all required fields before a track can enter PUBLISHED state.
 */
export function validateProductForPublish(songData) {
    const missing = [];

    if (!songData) {
        return { valid: false, errors: ["No product data supplied for validation."] };
    }

    if (!songData.title || typeof songData.title !== 'string' || !songData.title.trim()) {
        missing.push("Song Title is strictly required.");
    }
    if (!songData.artist || typeof songData.artist !== 'string' || !songData.artist.trim()) {
        missing.push("Primary Artist name is required.");
    }
    if (!songData.artworkUrl && !songData.coverStorageKey) {
        missing.push("Cover Artwork is missing.");
    }
    if (!songData.audioUrl && !songData.previewStorageKey) {
        missing.push("Public Preview Audio is missing.");
    }
    if (!songData.downloadUrl && !songData.masterStorageKey) {
        missing.push("Private Master Audio is missing.");
    }
    if (songData.price === undefined || songData.price === null || isNaN(Number(songData.price)) || Number(songData.price) <= 0) {
        missing.push("Authoritative selling price must be greater than zero (e.g. KSh 100, 300, 500).");
    }
    if (!songData.currency) {
        missing.push("Currency specification is required.");
    }

    return {
        valid: missing.length === 0,
        errors: missing
    };
}

export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const productId = url.searchParams.get('id');

    try {
        if (productId) {
            const res = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${productId}.json`);
            const song = await res.json();
            if (!song) {
                return jsonResponse({ success: false, error: "Song not found" }, 404);
            }
            return jsonResponse({ success: true, product: song });
        } else {
            const res = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs.json`);
            const allSongs = await res.json() || {};
            return jsonResponse({ success: true, products: allSongs });
        }
    } catch (err) {
        return jsonResponse({ success: false, error: err.message }, 500);
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { action, product, adminEmail = 'admin@aliwelekhasia.com', adminRole = 'SUPER_ADMIN' } = body;

        // Verify role authorization
        if (adminRole === 'SALES_VIEWER') {
            return jsonResponse({
                success: false,
                error: "Unauthorized: Accounts with SALES_VIEWER role cannot modify music products."
            }, 403);
        }

        if (!product || !product.id) {
            return jsonResponse({ success: false, error: "Product ID and details are required." }, 400);
        }

        const productId = product.id;

        // 1. VALIDATE ONLY
        if (action === 'validate') {
            const validation = validateProductForPublish(product);
            return jsonResponse({
                success: true,
                valid: validation.valid,
                errors: validation.errors
            });
        }

        // 2. SAVE DRAFT
        if (action === 'saveDraft') {
            const draftProduct = {
                ...product,
                status: 'DRAFT',
                updatedAt: Date.now()
            };

            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${productId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draftProduct)
            });

            // Log audit
            await recordAuditLog('SAVE_DRAFT', productId, adminEmail, `Saved song "${draftProduct.title}" as DRAFT.`);

            return jsonResponse({
                success: true,
                message: `Song "${draftProduct.title}" safely saved as DRAFT.`,
                product: draftProduct
            });
        }

        // 3. PUBLISH
        if (action === 'publish') {
            const validation = validateProductForPublish(product);
            if (!validation.valid) {
                return jsonResponse({
                    success: false,
                    error: "This song cannot be published due to missing required elements.",
                    missing: validation.errors
                }, 422);
            }

            const publishedProduct = {
                ...product,
                status: 'PUBLISHED',
                updatedAt: Date.now()
            };

            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${productId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(publishedProduct)
            });

            await recordAuditLog('PUBLISH_SONG', productId, adminEmail, `Published song "${publishedProduct.title}" to public store at ${publishedProduct.currency || 'KES'} ${publishedProduct.price}.`);

            return jsonResponse({
                success: true,
                message: `Song "${publishedProduct.title}" published successfully!`,
                product: publishedProduct
            });
        }

        // 4. UNPUBLISH
        if (action === 'unpublish') {
            const unpublishedProduct = {
                ...product,
                status: 'UNPUBLISHED',
                updatedAt: Date.now()
            };

            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${productId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(unpublishedProduct)
            });

            await recordAuditLog('UNPUBLISH_SONG', productId, adminEmail, `Unpublished song "${unpublishedProduct.title}". Existing customer entitlements preserved.`);

            return jsonResponse({
                success: true,
                message: `Song "${unpublishedProduct.title}" is now UNPUBLISHED (hidden from new buyers).`,
                product: unpublishedProduct
            });
        }

        // 5. ARCHIVE
        if (action === 'archive') {
            const archivedProduct = {
                ...product,
                status: 'ARCHIVED',
                updatedAt: Date.now()
            };

            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${productId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(archivedProduct)
            });

            await recordAuditLog('ARCHIVE_SONG', productId, adminEmail, `Archived song "${archivedProduct.title}". Historical orders and customer downloads preserved.`);

            return jsonResponse({
                success: true,
                message: `Song "${archivedProduct.title}" archived successfully. Historical orders and entitlements remain intact.`,
                product: archivedProduct
            });
        }

        // 6. DELETE WITH CUSTOMER PROTECTION CHECK
        if (action === 'delete') {
            // Check for existing orders
            const ordersRes = await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/orders.json`);
            const orders = await ordersRes.json() || {};
            const paidOrders = Object.values(orders).filter(o => o && (o.productId === productId || o.productTitle === product.title) && o.paymentStatus === 'PAID');

            if (paidOrders.length > 0) {
                // Permanent deletion is strictly blocked
                // Auto-archive instead
                const archivedProduct = {
                    ...product,
                    status: 'ARCHIVED',
                    updatedAt: Date.now()
                };

                await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${productId}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(archivedProduct)
                });

                await recordAuditLog('PREVENTED_DELETE_AUTO_ARCHIVED', productId, adminEmail, `Permanent delete blocked due to ${paidOrders.length} existing customer purchases. Song auto-archived.`);

                return jsonResponse({
                    success: false,
                    blocked: true,
                    autoArchived: true,
                    error: `This song has ${paidOrders.length} existing customer purchases. Permanent deletion is blocked. The song has been archived instead to preserve customer download entitlements.`
                }, 409);
            }

            // If zero purchases, delete
            await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/songs/${productId}.json`, {
                method: 'DELETE'
            });

            await recordAuditLog('DELETE_SONG', productId, adminEmail, `Permanently deleted song "${product.title}" (0 existing customer purchases).`);

            return jsonResponse({
                success: true,
                message: `Song "${product.title}" permanently removed.`
            });
        }

        return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);

    } catch (err) {
        console.error("Product management API error:", err);
        return jsonResponse({ success: false, error: err.message }, 500);
    }
}

async function recordAuditLog(action, productId, adminEmail, summary) {
    try {
        const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const logEntry = {
            id: logId,
            adminId: adminEmail,
            action,
            productId,
            module: 'MUSIC_STORE',
            summary,
            timestamp: Date.now()
        };

        await fetch(`${FIREBASE_DB_URL}/aliwelekhasia/audit_logs/${logId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logEntry)
        });
    } catch (e) {
        console.warn("Failed to write audit log:", e);
    }
}
