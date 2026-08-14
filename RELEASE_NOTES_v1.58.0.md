# Release Notes - v1.58.0

**Release Date:** August 14, 2026  
**Commit:** 2227b11

## 🎉 What's New

### Fixed: +More Tab Image Loading Issue
The "+More" tab now properly loads and displays all 18 cartoon puzzle images from the GitHub CDN.

## 🔧 Changes

### Content Security Policy (CSP) Updates
- **Added GitHub API support**: `api.github.com` to `connect-src` directive
- **Added jsDelivr CDN**: `cdn.jsdelivr.net` to both `img-src` and `connect-src`
- **Added GitHub Raw CDN**: `raw.githubusercontent.com` as backup CDN option

**Updated CSP in `index.html`:**
```html
<!-- Before -->
img-src 'self' data: blob: https://avatars.githubusercontent.com https://github.com;
connect-src 'self' blob: data:;

<!-- After -->
img-src 'self' data: blob: https://avatars.githubusercontent.com https://github.com https://cdn.jsdelivr.net https://raw.githubusercontent.com;
connect-src 'self' blob: data: https://api.github.com https://cdn.jsdelivr.net https://raw.githubusercontent.com;
```

### Image Discovery Improvements
- **Refactored `ImageStore.discoverCartoonImages()`**
  - Now uses GitHub Contents API for dynamic puzzle discovery
  - Eliminates sequential HEAD requests (faster, more reliable)
  - Automatically discovers all available cartoon puzzles
  - Graceful fallback to static list if API fails

### Code Quality
- Added comprehensive error handling
- Improved logging for debugging
- Better user feedback messages
- Documentation added (CSP_FIX_SUMMARY.md, DEBUG_MORE_TAB.md)

## 🐛 Fixes
- ✅ Content Security Policy blocking external CDN requests
- ✅ Cartoon puzzle images not loading in +More tab
- ✅ GitHub API fetch failures
- ✅ Progressive caching now works correctly
- ✅ Correct puzzle loads when clicking Start button

## 📦 Technical Details

### Files Modified
- `index.html` - Updated CSP headers
- `package.json` - Version bump to 1.58.0
- `src/app/AppVersion.js` - Updated version and build date
- `src/storage/ImageStore.js` - Refactored cartoon image discovery
- `src/ui/HomeView.js` - Improved error handling

### Build Information
- **Version:** 1.58.0
- **Build Date:** 2026-08-14
- **Bundle Size:** 364.14 kB (105.27 kB gzipped)
- **Vite Version:** 5.4.21
- **PixiJS Version:** 8.6.6

## 🚀 Deployment
Changes have been pushed to the `main` branch and are ready for deployment to Cloudflare Pages.

## 📝 Testing
1. Navigate to the "+More" tab
2. Verify all 18 cartoon puzzle cards appear
3. Verify images load successfully (no CSP errors)
4. Click any puzzle card to play
5. Verify the correct cartoon puzzle loads (not the first library image)
6. After first load, images should cache for offline use

## 🔒 Security Note
The CSP changes maintain strong security by only whitelisting specific, trusted CDN domains. No wildcards were added, and all other security directives remain unchanged.

## 🙏 Credits
Fixed issues reported in user testing. Special thanks for the detailed console logs that helped identify the CSP blocking issue.
