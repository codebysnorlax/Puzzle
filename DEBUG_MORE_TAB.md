# Debugging Guide: +More Tab Image Loading Issue

## Changes Made

### 1. ImageStore.js - discoverCartoonImages()
- Changed from sequential HEAD requests to single GitHub API call
- Added comprehensive logging
- Better error handling with fallback
- Now fetches from: `https://api.github.com/repos/codebysnorlax/assets/contents/puzzle_img/cartoon_img`

### 2. HomeView.js - loadMoreTabPuzzles()
- Added detailed console logging
- Added image error logging in onerror handler
- Better debugging for each card creation

## How to Test

### Step 1: Start Dev Server
```bash
cd /home/snorlax/Desktop/ex-lab/lab_4/Puzzle
npm run dev
```

### Step 2: Open Browser Console
1. Open the app in your browser (usually http://localhost:5173)
2. Open DevTools (F12)
3. Go to Console tab

### Step 3: Click "+More" Tab
Look for these console logs:
```
[HomeView] loadMoreTabPuzzles called, cartoonCatalog: ...
[ImageStore] Fetching cartoon puzzles from GitHub API...
[ImageStore] GitHub API returned X items
[ImageStore] Found X .webp files
[ImageStore] ✓ Discovered X cartoon puzzles from GitHub API
[HomeView] Cartoon discovery complete: [...]
[HomeView] Loading cartoon puzzles into grid: X puzzles
[HomeView] Cached cartoon puzzles from DB: X
[HomeView] Creating card for cartoon_1: cached=false, url=...
... (for each puzzle)
[HomeView] All cartoon cards added to grid
```

### Step 4: Check Network Tab
1. Go to DevTools > Network tab
2. Filter by "Img"
3. You should see requests to:
   - `https://cdn.jsdelivr.net/gh/codebysnorlax/assets@main/puzzle_img/cartoon_img/puzzle_cartoon_01.webp`
   - And so on...

## Common Issues & Solutions

### Issue 1: Images not appearing
**Check:** Console for image load errors
**Solution:** The img element has `onerror` handler that logs to console. Check for CORS or 404 errors.

### Issue 2: GitHub API rate limit
**Symptom:** Console shows "GitHub API returned 403" or "rate limit exceeded"
**Solution:** The code has a fallback that creates 18 static entries. Images will still load from CDN.

### Issue 3: CORS errors
**Symptom:** Console shows "CORS policy" errors
**Solution:** jsdelivr.net CDN should have `access-control-allow-origin: *`. If you see this, check if URL is correct.

### Issue 4: "Showing first library image" when playing
**Symptom:** Clicking Start on a cartoon puzzle loads the first library image instead
**Solution:** Check if the card has correct `data-id` and `data-url` attributes:
```javascript
// In browser console, when on +More tab:
document.querySelectorAll('.image-card').forEach(card => {
  console.log(card.dataset.id, card.dataset.url);
});
```

## Manual Test in Browser Console

Paste this in browser console to manually test GitHub API:
```javascript
fetch('https://api.github.com/repos/codebysnorlax/assets/contents/puzzle_img/cartoon_img')
  .then(r => r.json())
  .then(files => {
    console.log('Total files:', files.length);
    const webp = files.filter(f => f.name.endsWith('.webp'));
    console.log('WebP files:', webp.length);
    console.log('Files:', webp.map(f => f.name));
  })
  .catch(err => console.error('Error:', err));
```

## Manual Test Image Loading

Test if a single cartoon image loads:
```javascript
const testImg = new Image();
testImg.crossOrigin = 'anonymous';
testImg.onload = () => console.log('✓ Image loaded successfully!', testImg.width, 'x', testImg.height);
testImg.onerror = (e) => console.error('✗ Image load failed:', e);
testImg.src = 'https://cdn.jsdelivr.net/gh/codebysnorlax/assets@main/puzzle_img/cartoon_img/puzzle_cartoon_01.webp';
```

## Verification Checklist

- [ ] GitHub API call succeeds and returns 18 files
- [ ] Console shows "✓ Discovered 18 cartoon puzzles"
- [ ] +More tab shows 18 puzzle cards + 1 "More Coming Soon" card
- [ ] Images load (skeleton disappears, image appears)
- [ ] Clicking a cartoon puzzle card shows it selected
- [ ] Clicking "Start" button launches the correct cartoon puzzle (not library image)
- [ ] After playing, returning to +More tab shows completed status

## Next Steps if Still Not Working

1. Share the console output when clicking +More tab
2. Share any Network tab errors
3. Check if the issue is:
   - Images not appearing in grid (HTML generation issue)
   - Images appearing but not loading (fetch/CORS issue)
   - Images loading but wrong image when playing (game launch issue)
