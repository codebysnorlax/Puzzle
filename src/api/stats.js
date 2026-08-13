/**
 * Cloudflare Worker API Handler — /api/stats
 * Enhanced Cloudflare Workers KV implementation for real visitor tracking & user metadata storage.
 * Uses IP-based hashing to prevent duplicate visit counts.
 * 
 * KV Data Schema:
 * - "stats:total_visits" -> Total page load / visit count
 * - "stats:unique_count" -> Real unique visitors count
 * - "user:<visitorId>"   -> User profile & device metadata object
 */

/**
 * Simple hash function to create consistent hash from IP address
 * @param {string} str 
 * @returns {string}
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `ip_${Math.abs(hash).toString(36)}`;
}

export async function handleStats(request, env) {
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Defensive wrapper so unexpected exceptions are logged
  try {
    const kv = env ? env.STATS_KV : null;

    // Get real IP address from Cloudflare headers
    const clientIP = request.headers.get('cf-connecting-ip') || 
                     request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     'unknown';

    // Cloudflare Request Metadata Headers
    const country = request.headers.get('cf-ipcountry') || 'Unknown';
    const city = request.headers.get('cf-ipcity') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Basic request log for observability
    console.log(`[stats] request=${request.method} path=${url.pathname}${url.search} ip=${clientIP} country=${country} ua="${userAgent}"`);

    // Handle IP hash request
    if (url.searchParams.get('action') === 'get_ip_hash') {
      const visitorId = hashString(clientIP);
      console.log(`[stats] action=get_ip_hash visitorId=${visitorId}`);
      return new Response(JSON.stringify({ visitorId }), { headers: corsHeaders });
    }

    if (request.method === 'POST' || url.searchParams.get('action') === 'visit') {
      let body = {};
      try {
        if (request.method === 'POST') {
          body = await request.json();
        }
      } catch (e) {
        // Non-fatal: log and continue with empty body
        console.warn(`[stats] invalid JSON body: ${e && e.message}`);
      }

      // Use IP-based hash as visitor ID for consistency
      const ipBasedId = hashString(clientIP);
      const visitorId = body.visitorId || ipBasedId;
      const userKey = `user:${visitorId}`;

      console.log(`[stats] visit start visitorId=${visitorId} userKey=${userKey} kv_present=${!!kv}`);

      let totalVisits = 0;
      let uniqueVisitors = 0;

      if (kv) {
        // Batch KV reads for better performance
        const [totalStr, uniqueStr, existingUserData] = await Promise.all([
          kv.get('stats:total_visits'),
          kv.get('stats:unique_count'),
          kv.get(userKey, { type: 'json' })
        ]);

        // 1. Always increment Total / Frequent visits counter
        const currentTotal = parseInt(totalStr || '0', 10);
        totalVisits = currentTotal + 1;

        // 2. Handle user profile
        let userData = null;

        if (!existingUserData) {
          // Brand new unique user
          userData = {
            visitorId,
            country,
            city,
            userAgent,
            language: body.language || 'en',
            screen: body.screen || '',
            timezone: body.timezone || '',
            firstVisit: Date.now(),
            lastVisit: Date.now(),
            visitCount: 1
          };

          // Persist new user and increment unique count
          await Promise.all([
            kv.put(userKey, JSON.stringify(userData)),
            kv.put('stats:unique_count', String((parseInt(uniqueStr || '0', 10) + 1)))
          ]);

          uniqueVisitors = parseInt(uniqueStr || '0', 10) + 1;
          console.log(`[stats] new_user persisted visitorId=${visitorId} uniqueVisitors=${uniqueVisitors}`);
        } else {
          // Existing user: update lastVisit & visitCount
          userData = existingUserData;
          userData.lastVisit = Date.now();
          userData.visitCount = (userData.visitCount || 0) + 1;
          await kv.put(userKey, JSON.stringify(userData));
          uniqueVisitors = parseInt(uniqueStr || '0', 10);
          console.log(`[stats] existing_user updated visitorId=${visitorId} visitCount=${userData.visitCount}`);
        }

        // Persist total visits
        await kv.put('stats:total_visits', String(totalVisits));
        console.log(`[stats] totals updated totalVisits=${totalVisits} uniqueVisitors=${uniqueVisitors}`);
      } else {
        // No KV bound — return counts only in-memory for this invocation
        totalVisits = 1;
        uniqueVisitors = 0;
        console.warn('[stats] STATS_KV is not bound; skipping persistence');
      }

      const payload = { visitorId, totalVisits, uniqueVisitors };
      console.log(`[stats] response payload=${JSON.stringify(payload)}`);
      return new Response(JSON.stringify(payload), { headers: corsHeaders });
    }

    // Default: method not allowed
    console.log('[stats] method not allowed', request.method);
    return new Response(null, { status: 405, headers: corsHeaders });
  } catch (err) {
    // Log the full error for Observability
    console.error('[stats] unhandled error:', err && (err.stack || err.message || err));
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
