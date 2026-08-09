/**
 * Cloudflare Pages Function — /api/stats
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
export async function onRequest(context) {
  const { request, env } = context;
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

  const kv = env ? env.STATS_KV : null;

  // Get real IP address from Cloudflare headers
  const clientIP = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   'unknown';

  // Cloudflare Request Metadata Headers
  const country = request.headers.get('cf-ipcountry') || 'Unknown';
  const city = request.headers.get('cf-ipcity') || '';
  const userAgent = request.headers.get('user-agent') || '';

  // Handle IP hash request
  if (url.searchParams.get('action') === 'get_ip_hash') {
    const visitorId = hashString(clientIP);
    return new Response(JSON.stringify({ visitorId }), { headers: corsHeaders });
  }

  if (request.method === 'POST' || url.searchParams.get('action') === 'visit') {
    let body = {};
    try {
      if (request.method === 'POST') {
        body = await request.json();
      }
    } catch (e) {}

    // Use IP-based hash as visitor ID for consistency
    const ipBasedId = hashString(clientIP);
    const visitorId = body.visitorId || ipBasedId;
    const userKey = `user:${visitorId}`;

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

        const currentUnique = parseInt(uniqueStr || '0', 10);
        uniqueVisitors = currentUnique + 1;
      } else {
        // Returning user — update lastVisit & increment user visitCount
        uniqueVisitors = parseInt(uniqueStr || '1', 10);
        userData = {
          ...existingUserData,
          country: country !== 'Unknown' ? country : existingUserData.country,
          city: city || existingUserData.city,
          userAgent: userAgent || existingUserData.userAgent,
          language: body.language || existingUserData.language,
          screen: body.screen || existingUserData.screen,
          timezone: body.timezone || existingUserData.timezone,
          lastVisit: Date.now(),
          visitCount: (existingUserData.visitCount || 1) + 1
        };
      }

      // 3. Batch KV writes for better performance
      const kvWrites = [
        kv.put('stats:total_visits', totalVisits.toString()),
        kv.put(userKey, JSON.stringify(userData), {
          expirationTtl: 60 * 60 * 24 * 90 // Auto-cleanup after 90 days
        })
      ];

      if (!existingUserData) {
        kvWrites.push(kv.put('stats:unique_count', uniqueVisitors.toString()));
      }

      await Promise.all(kvWrites);
    } else {
      // Dev Server / Local memory fallback
      totalVisits = parseInt(globalThis._totalVisits || '0', 10) + 1;
      globalThis._totalVisits = totalVisits;

      globalThis._usersMap = globalThis._usersMap || new Map();
      if (!globalThis._usersMap.has(visitorId)) {
        globalThis._usersMap.set(visitorId, {
          visitorId, country, city, userAgent,
          firstVisit: Date.now(), lastVisit: Date.now(), visitCount: 1
        });
      } else {
        const u = globalThis._usersMap.get(visitorId);
        u.lastVisit = Date.now();
        u.visitCount += 1;
      }
      uniqueVisitors = globalThis._usersMap.size;
    }

    return new Response(JSON.stringify({
      total: totalVisits,
      unique: uniqueVisitors,
      visitorId
    }), { headers: corsHeaders });
  }

  // GET request: Fetch current stats from KV
  let totalVisits = 0;
  let uniqueVisitors = 0;

  if (kv) {
    const [totalStr, uniqueStr] = await Promise.all([
      kv.get('stats:total_visits'),
      kv.get('stats:unique_count')
    ]);
    totalVisits = parseInt(totalStr || '0', 10);
    uniqueVisitors = parseInt(uniqueStr || '0', 10);
  } else {
    totalVisits = parseInt(globalThis._totalVisits || '0', 10);
    uniqueVisitors = globalThis._usersMap ? globalThis._usersMap.size : 0;
  }

  return new Response(JSON.stringify({
    total: totalVisits,
    unique: uniqueVisitors
  }), { headers: corsHeaders });
}
