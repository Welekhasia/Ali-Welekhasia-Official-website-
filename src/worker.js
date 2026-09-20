/**
 * Ali Welekhasia Official Music Platform
 * Cloudflare Worker Entry Point (api.aliwelekhasia.co.ke)
 *
 * Architecture:
 * - D1 Binding: env.DB (ali-welekhasia-production-db)
 * - R2 Binding: env.BUCKET (ali-music-audio)
 * - ES Modules Native Worker
 */

import { handleRequest } from './router.js';

export default {
    async fetch(request, env, ctx) {
        return await handleRequest(request, env, ctx);
    }
};
