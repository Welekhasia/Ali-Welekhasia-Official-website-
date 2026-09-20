/**
 * Pages Function: /api/artists and /api/artists/*
 */

import { handleRequest } from '../../../src/router.js';

export async function onRequest(context) {
    return await handleRequest(context.request, context.env, context);
}
