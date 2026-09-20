/**
 * Pages Function: GET /api/health
 */

import { handleRequest } from '../../src/router.js';

export async function onRequest(context) {
    return await handleRequest(context.request, context.env, context);
}
