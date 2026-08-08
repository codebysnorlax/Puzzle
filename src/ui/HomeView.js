import { SettingsStore } from '../storage/SettingsStore.js';
import { ImageStore } from '../storage/ImageStore.js';

/**
 * HomeView — Progressive Chunked Gallery & Floating Capsule Navbar
 * Pill-rounded navbar control boxes, micro green dot cached indicator, and smart Load More visibility.
 */
export class HomeView {
  constructor(container, onStartGame) {
    this.container = container;
    this.onStartGame = onStartGame;

    // Built-in sample images
    this.sampleImages = [
      { id: 'demo1', name: 'Mountain Landscape', url: './puzzles/demo.jpg', isCustom: false },
      { id: 'demo2', name: 'Scenic Sunset', url: './puzzles/demo2.jpg', isCustom: false },
      { id: 'snorlax', name: 'Snorlax', url: './puzzles/snorlax.png', isCustom: false },
      { id: 'test', name: 'Vibrant Artwork', url: './puzzles/test.jpg', isCustom: false }
    ];

    // Catalog of 19 call puzzles
    this.callPuzzles = Array.from({ length: 19 }, (_, i) => ({
      id: `call_puzzle_${i + 1}`,
      name: `Puzzle ${i + 1}`,
      url: `./call/puzzle${i + 1}.png`,
      isCustom: false,
      isCallPuzzle: true
    }));

    this.customImages = [];
    this.cachedIds = new Set(); // Set of image IDs currently saved in IndexedDB

    // Progressive Chunking parameters
    this.chunkSize = 6;
    this.displayedCount = 6; // Initial chunk size

    this.selectedImage = this.sampleImages[0].url;
    this.selectedImageId = this.sampleImages[0].id;
    this.selectedMode = 'normal'; // Default: Normal Grid Swap
    this.selectedDifficulty = 'normal'; // 'easy', 'normal', 'hard', 'expert'

    this.render();
    this.loadCustomAndCachedImages();
  }

  async loadCustomAndCachedImages() {
    try {
      const records = await ImageStore.getAllImages();
      this.customImages = records.filter(r => r.isCustom);
      
      // Track all cached IDs in IndexedDB
      this.cachedIds = new Set(records.map(r => r.id));

      this.updateGalleryGrid();
    } catch (err) {
      console.warn('[HomeView] Failed to load cached images from IndexedDB:', err);
    }
  }

  render() {
    const currentTheme = SettingsStore.getSettings().theme || 'light';

    this.element = document.createElement('div');
    this.element.className = 'view home-view active';

    this.element.innerHTML = `
      <!-- Top Header Navbar with Centered Start CTA & Pill-Rounded Capsule Toolbars -->
      <header class="home-header">
        <div class="nav-left">
          <h1 class="home-title">Pick and Play</h1>
        </div>

        <!-- Center: Start Capsule CTA -->
        <div class="nav-center">
          <button class="btn btn-primary nav-start-btn" id="btn-start">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start Puzzle
          </button>
        </div>

        <div class="nav-right">
          <!-- 100% Pill-Rounded Segmented Capsule Navbar Group -->
          <div class="nav-segmented-capsule nav-select-group">
            <div class="custom-select-wrap" style="border-right: 1px solid var(--border-subtle);">
              <select class="nav-select nav-segmented-select" id="nav-mode-select" title="Puzzle Mode">
                <option value="normal" selected>Mode: Normal</option>
                <option value="jigsaw">Mode: Jigsaw</option>
              </select>
            </div>

            <div class="custom-select-wrap" style="border-right: 1px solid var(--border-subtle);">
              <select class="nav-select nav-segmented-select" id="nav-diff-select" title="Difficulty Level">
                <option value="easy">Easy (9)</option>
                <option value="normal" selected>Normal (16)</option>
                <option value="hard">Hard (25)</option>
                <option value="expert">Expert (36)</option>
              </select>
            </div>

            <!-- Single Dynamic Light / Dark Theme Toggle Button -->
            <button class="nav-segmented-btn" id="home-theme-toggle-single" title="Toggle Light / Dark Theme">
              ${currentTheme === 'dark' ? `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ` : `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              `}
            </button>
          </div>

          <!-- Mobile Hamburger Toggle Button -->
          <div class="hamburger-btn-wrap">
            <button class="btn btn-icon" id="btn-hamburger" title="Open Controls Menu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Section: Image Gallery -->
      <main>
        <section class="flat-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
            <h2 class="home-section-title" style="margin-bottom: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Choose Mystery Puzzle
            </h2>
            <span id="gallery-count-badge" style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted);">
              Showing 6 of 23
            </span>
          </div>

          <div class="image-grid" id="image-grid">
            <!-- Grid cards populated dynamically in updateGalleryGrid -->
          </div>

          <!-- Progressive Chunk Load More Button -->
          <div id="load-more-wrap" style="display: flex; justify-content: center; margin-top: var(--space-4);">
            <button class="nav-start-btn" id="btn-load-more" style="min-height: 30px; padding: 0 1.2em; font-size: 0.78rem;">
              Load More Puzzles (+6)
            </button>
          </div>
        </section>
      </main>

      <!-- Mobile Hamburger Drawer Overlay -->
      <div class="mobile-drawer-overlay" id="mobile-drawer">
        <div class="mobile-drawer-content">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
            <span style="font-weight: 700; font-size: 1rem;">Puzzle Controls</span>
            <button class="btn btn-icon" id="btn-close-drawer" style="width: 32px; height: 32px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: var(--space-3);">
            <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Puzzle Mode</label>
            <div class="custom-select-wrap">
              <select class="nav-select" id="mobile-mode-select" style="width: 100%;">
                <option value="normal" selected>Normal (Grid Swap)</option>
                <option value="jigsaw">Jigsaw (Interlocking)</option>
              </select>
            </div>

            <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-top: var(--space-2);">Difficulty Level</label>
            <div class="custom-select-wrap">
              <select class="nav-select" id="mobile-diff-select" style="width: 100%;">
                <option value="easy">Easy (9)</option>
                <option value="normal" selected>Normal (16)</option>
                <option value="hard">Hard (25)</option>
                <option value="expert">Expert (36)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.updateGalleryGrid();
    this.bindEvents();
  }

  updateGalleryGrid() {
    const grid = this.element.querySelector('#image-grid');
    if (!grid) return;

    // Full catalog: Samples + Call Puzzles + Custom Uploads
    const fullCatalog = [...this.sampleImages, ...this.callPuzzles, ...this.customImages];
    const totalCount = fullCatalog.length;

    // Check how many items are already cached locally in IndexedDB
    const uncachedRemoteCount = this.callPuzzles.filter(p => !this.cachedIds.has(p.id)).length;

    // Slice current chunk to display
    const visibleItems = fullCatalog.slice(0, this.displayedCount);

    // Update count badge text
    const countBadge = this.element.querySelector('#gallery-count-badge');
    if (countBadge) {
      countBadge.textContent = `Showing ${visibleItems.length} of ${totalCount}`;
    }

    // Smart Load More Button visibility:
    // Hide if all items displayed OR if there are no uncached remote call images left to load!
    const loadMoreWrap = this.element.querySelector('#load-more-wrap');
    if (loadMoreWrap) {
      const shouldHide = this.displayedCount >= totalCount || uncachedRemoteCount === 0;
      loadMoreWrap.style.display = shouldHide ? 'none' : 'flex';
    }

    grid.innerHTML = `
      ${visibleItems.map(img => {
        const isSelected = (this.selectedImageId && this.selectedImageId === img.id) || (this.selectedImage === img.url || this.selectedImage === img.blob);
        const isCached = this.cachedIds.has(img.id);

        return `
          <div class="image-card ${isSelected ? 'selected' : ''}" data-url="${img.url}" data-id="${img.id}" data-name="${img.name}" data-is-call="${img.isCallPuzzle || false}">
            <img src="${img.url}" alt="${img.name}" loading="lazy" />
            <div class="image-card-noise-overlay"></div>

            <!-- Micro Green Dot Indicator for Cached Local Images -->
            ${isCached ? `<div class="image-card-cached-dot" title="Saved locally in IndexedDB"></div>` : ''}

            <!-- Clean Mystery Badge at Bottom Right -->
            <div class="image-card-mystery-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Mystery
            </div>

            ${img.isCustom ? `
              <button class="image-card-delete" data-delete-id="${img.id}" title="Delete Custom Image">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            ` : ''}
          </div>
        `;
      }).join('')}

      <div class="image-card image-card-upload" id="upload-card">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span style="font-size: 0.78rem; font-weight: 600;">Upload</span>
        <input type="file" id="file-input" accept="image/*" style="display: none;" />
      </div>
    `;

    this.bindGalleryEvents();
  }

  bindGalleryEvents() {
    const grid = this.element.querySelector('#image-grid');
    if (!grid) return;

    // Image card selection & automatic local caching
    const cards = grid.querySelectorAll('.image-card:not(.image-card-upload)');
    cards.forEach(card => {
      card.addEventListener('click', async (e) => {
        if (e.target.closest('.image-card-delete')) return; // Ignore delete button clicks

        grid.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        const id = card.dataset.id;
        const url = card.dataset.url;
        const name = card.dataset.name;
        const isCall = card.dataset.isCall === 'true';

        this.selectedImageId = id;

        // Check if custom image Blob
        const customImg = this.customImages.find(c => c.id === id);
        if (customImg) {
          this.selectedImage = customImg.blob;
        } else if (isCall) {
          // Smart automatic IndexedDB local caching on selection!
          const cached = await ImageStore.cacheRemoteImage(id, name, url);
          this.selectedImage = cached.blob || cached.url;
          this.cachedIds.add(id);
          this.updateGalleryGrid(); // Render micro green dot
        } else {
          this.selectedImage = url;
        }
      });
    });

    // Delete custom image button
    const deleteBtns = grid.querySelectorAll('.image-card-delete');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        if (confirm('Delete this custom image from local storage?')) {
          await ImageStore.deleteImage(id);
          this.customImages = this.customImages.filter(img => img.id !== id);
          this.cachedIds.delete(id);
          if (this.selectedImageId === id) {
            this.selectedImage = this.sampleImages[0].url;
            this.selectedImageId = this.sampleImages[0].id;
          }
          this.updateGalleryGrid();
        }
      });
    });

    // File upload
    const uploadCard = grid.querySelector('#upload-card');
    const fileInput = grid.querySelector('#file-input');

    if (uploadCard && fileInput) {
      uploadCard.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const savedRecord = await ImageStore.saveImage(file);
            this.customImages.push(savedRecord);
            this.cachedIds.add(savedRecord.id);
            this.selectedImage = savedRecord.blob;
            this.selectedImageId = savedRecord.id;
            this.updateGalleryGrid();
          } catch (err) {
            console.error('[HomeView] Failed to save image into IndexedDB:', err);
          }
        }
      });
    }
  }

  bindEvents() {
    // Scroll event listener for floating circular capsule header
    this.element.addEventListener('scroll', () => {
      const header = this.element.querySelector('.home-header');
      if (header) {
        if (this.element.scrollTop > 25) {
          header.classList.add('scrolled-floating');
        } else {
          header.classList.remove('scrolled-floating');
        }
      }
    });

    // Load More Puzzles progressive chunk button
    const btnLoadMore = this.element.querySelector('#btn-load-more');
    if (btnLoadMore) {
      btnLoadMore.addEventListener('click', () => {
        this.displayedCount += this.chunkSize;
        this.updateGalleryGrid();
      });
    }

    // Single Dynamic Theme toggle button
    const singleThemeBtn = this.element.querySelector('#home-theme-toggle-single');
    if (singleThemeBtn) {
      singleThemeBtn.addEventListener('click', () => {
        const current = SettingsStore.getSettings().theme || 'light';
        const nextTheme = current === 'dark' ? 'light' : 'dark';
        
        SettingsStore.saveSettings({ theme: nextTheme });
        SettingsStore.applyTheme(nextTheme);

        singleThemeBtn.innerHTML = nextTheme === 'dark' ? `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ` : `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        `;
      });
    }

    // Mode dropdown selects
    const desktopMode = this.element.querySelector('#nav-mode-select');
    const mobileMode = this.element.querySelector('#mobile-mode-select');

    const syncMode = (val) => {
      this.selectedMode = val;
      if (desktopMode) desktopMode.value = val;
      if (mobileMode) mobileMode.value = val;
    };

    if (desktopMode) desktopMode.addEventListener('change', (e) => syncMode(e.target.value));
    if (mobileMode) mobileMode.addEventListener('change', (e) => syncMode(e.target.value));

    // Difficulty dropdown selects
    const desktopDiff = this.element.querySelector('#nav-diff-select');
    const mobileDiff = this.element.querySelector('#mobile-diff-select');

    const syncDiff = (val) => {
      this.selectedDifficulty = val;
      if (desktopDiff) desktopDiff.value = val;
      if (mobileDiff) mobileDiff.value = val;
    };

    if (desktopDiff) desktopDiff.addEventListener('change', (e) => syncDiff(e.target.value));
    if (mobileDiff) mobileDiff.addEventListener('change', (e) => syncDiff(e.target.value));

    // Mobile Hamburger Drawer
    const btnHamburger = this.element.querySelector('#btn-hamburger');
    const mobileDrawer = this.element.querySelector('#mobile-drawer');
    const btnCloseDrawer = this.element.querySelector('#btn-close-drawer');

    if (btnHamburger && mobileDrawer) {
      btnHamburger.addEventListener('click', () => mobileDrawer.classList.add('active'));
      btnCloseDrawer.addEventListener('click', () => mobileDrawer.classList.remove('active'));
      mobileDrawer.addEventListener('click', (e) => {
        if (e.target === mobileDrawer) mobileDrawer.classList.remove('active');
      });
    }

    // Start puzzle button
    const btnStart = this.element.querySelector('#btn-start');
    btnStart.addEventListener('click', async () => {
      if (this.onStartGame) {
        let finalImage = this.selectedImage;

        // If selected image is a call puzzle URL, ensure locally cached in IndexedDB before launching
        if (typeof finalImage === 'string' && finalImage.includes('/call/')) {
          const id = this.selectedImageId || 'call_puzzle_1';
          const cached = await ImageStore.cacheRemoteImage(id, 'Call Puzzle', finalImage);
          finalImage = cached.blob || cached.url;
        }

        this.onStartGame({
          imageUrl: finalImage,
          mode: this.selectedMode,
          difficulty: this.selectedDifficulty
        });
      }
    });
  }

  show() {
    this.element.classList.add('active');
  }

  hide() {
    this.element.classList.remove('active');
  }
}
