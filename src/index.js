/**
 * Cloudflare Worker Entry Point with Static Assets
 * Routes /api/stats to the stats handler, serves static files for everything else
 */
import { handleStats } from './api/stats.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Route API requests to stats handler
    if (url.pathname === '/api/stats') {
      return handleStats(request, env);
    }
    
    // Serve static assets for everything else
    return env.ASSETS.fetch(request);
  }
};
