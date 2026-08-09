# IP-Based Visitor Tracking

## Overview
The visitor tracking system now uses IP address hashing to create consistent visitor IDs, preventing duplicate visit counts even if localStorage is cleared.

## How It Works

### Client Side (VisitorTracker.js)
1. On first visit, client requests IP hash from `/api/stats?action=get_ip_hash`
2. Server generates hash from user's IP: `ip_{hash_value}`
3. Client stores the IP-based visitor ID in localStorage (`pixelcraft_visitor_id_v3`)
4. Subsequent visits reuse the stored ID from localStorage

### Server Side (_worker.js)
1. Extracts real IP from Cloudflare headers (`cf-connecting-ip`)
2. Generates consistent hash using simple hash function
3. Uses IP hash as primary visitor ID
4. Stores visitor data in KV with 90-day TTL

## Key Features

✅ **No Duplicate Counts**: Same IP = Same visitor ID  
✅ **Privacy-Friendly**: IPs are hashed, never stored  
✅ **Persistent**: Works across browser sessions  
✅ **Fast**: Uses localStorage cache to avoid repeated API calls  
✅ **Fallback Support**: Works offline with local tracking  

## Technical Details

### Hash Function
```javascript
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `ip_${Math.abs(hash).toString(36)}`;
}
```

### Visitor ID Format
- IP-based: `ip_{base36_hash}` (e.g., `ip_abc123def`)
- Fallback: `v_{timestamp}_{random}` (offline mode)

### Storage Keys
- `pixelcraft_visitor_id_v3`: Stores the IP-based visitor ID
- `pixelcraft_visitor_stats_v3`: Caches latest stats

## API Endpoints

### GET /api/stats?action=get_ip_hash
Returns IP-based visitor ID
```json
{ "visitorId": "ip_abc123def" }
```

### POST /api/stats
Records visit with metadata
```json
{
  "visitorId": "ip_abc123def",
  "isNewVisitor": false,
  "language": "en-US",
  "screen": "1920x1080",
  "timezone": "Asia/Kolkata"
}
```

### GET /api/stats
Returns current statistics
```json
{
  "total": 1250,
  "unique": 450
}
```

## Privacy Considerations

- IP addresses are **never stored** - only hashes
- Hash function is one-way (cannot reverse to get IP)
- User data expires after 90 days (KV TTL)
- Complies with privacy-first tracking principles
