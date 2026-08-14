# Fix Summary: +More Tab Image Loading Issue

## Root Cause
**Content Security Policy (CSP)** was blocking external CDN requests.

The original CSP configuration in `index.html` had:
```
img-src 'self' data: blob: https://avatars.githubusercontent.com https://github.com;
connect-src 'self' blob: data:;
```

This blocked:
- ❌ GitHub API: `api.github.com` (for discovering cartoon images)
- ❌ jsDelivr CDN: `cdn.jsdelivr.net` (for loading cartoon images)
- ❌ GitHub Raw: `raw.githubusercontent.com` (alternative CDN)

## Solution
Updated CSP to whitelist the required domains:

### Changed Lines in `index.html`:
```html
<!-- BEFORE -->
img-src 'self' data: blob: https://avatars.githubusercontent.com https://github.com;
connect-src 'self' blob: data:;

<!-- AFTER -->
img-src 'self' data: blob: https://avatars.githubusercontent.com https://github.com https://cdn.jsdelivr.net https://raw.githubusercontent.com;
connect-src 'self' blob: data: https://api.github.com https://cdn.jsdelivr.net https://raw.githubusercontent.com;
```

## What's Fixed
✅ **GitHub API Discovery**: App can now fetch the list of cartoon puzzles from GitHub API  
✅ **Image Loading**: Cartoon puzzle images load from jsDelivr CDN  
✅ **Fallback Support**: GitHub Raw CDN is also whitelisted as backup  
✅ **Progressive Caching**: Images can be fetched and cached to IndexedDB  

## Testing
1. Restart your dev server:
   ```bash
   npm run preview
   # or
   npm run dev
   ```

2. Open browser and navigate to +More tab
3. Console should now show:
   ```
   ✓ [ImageStore] Discovered 18 cartoon puzzles from GitHub API
   ```
4. Images should load successfully (no CSP errors)
5. After images load, they'll be cached to IndexedDB for offline use

## Additional Changes Made (Previous)
1. **ImageStore.js**: Refactored `discoverCartoonImages()` to use GitHub API instead of sequential HEAD requests
2. **HomeView.js**: Added comprehensive logging for debugging
3. Better error handling and fallback mechanisms

## Security Note
The CSP still maintains strong security by:
- Only allowing specific trusted domains (GitHub, jsDelivr)
- Blocking inline scripts from external sources
- Preventing object/embed tags
- Restricting base URI changes
- No wildcard domains

These domains are legitimate CDNs used for hosting open-source assets.
