import { SettingsStore } from '../storage/SettingsStore.js';
import { ImageStore } from '../storage/ImageStore.js';
import { APP_VERSION } from '../app/AppVersion.js';
import { escapeHtml, validateImageFile } from '../utils/security.js';
import { PuzzleStatusStore } from '../storage/PuzzleStatusStore.js';

/**
 * HomeView — Clean Navbar with Radio Difficulty & IndexedDB-First WebP Gallery
 */
export class HomeView {
  constructor(container, onStartGame, app = null) {
    this.container = container;
    this.onStartGame = onStartGame;
    this.app = app;

    this.builtinPuzzles = [];
    this.customImages = [];
    this.chunkSize = 12;
    this.displayedCount = 25;
    this.selectedImage = './images/demo.webp';
    this.selectedImageId = 'demo1';
    this.selectedDifficulty = 'normal';

    this.render();
    this.initImagesAndCaching();
  }

  async initImagesAndCaching() {
    // 1. Initial render with local/cached data
    await this.refreshCatalog();

    // 2. Ensure all built-in images are cached 1-by-1 into IndexedDB
    // On Cloudflare Pages deployment, this runs on first visit and marks localStorage 'puzzles_cached' = 'true'
    ImageStore.ensureAllCached((curr, total) => {
      const countBadge = this.element.querySelector('#gallery-count-badge');
      if (countBadge && localStorage.getItem('puzzles_cached') !== 'true') {
        countBadge.textContent = `Caching Offline Puzzles (${curr}/${total})...`;
      }
    }).then(() => {
      this.refreshCatalog();
    }).catch(err => {
      console.warn('[HomeView] Image caching error:', err);
    });
  }

  async refreshCatalog() {
    try {
      this.builtinPuzzles = await ImageStore.getAllBuiltinImages();
      this.customImages = await ImageStore.getCustomImages();

      // Ensure selected image reference is valid
      const selectedItem = [...this.builtinPuzzles, ...this.customImages].find(img => img.id === this.selectedImageId);
      if (selectedItem) {
        this.selectedImage = selectedItem.blob ? URL.createObjectURL(selectedItem.blob) : selectedItem.url;
      }

      this.updateGalleryGrid();
    } catch (err) {
      console.warn('[HomeView] Catalog refresh error:', err);
    }
  }

  updatePwaInstallState(show) {
    const installBtn = this.element.querySelector('#btn-pwa-install-home');
    if (installBtn) {
      installBtn.style.display = show ? 'inline-flex' : 'none';
    }
  }

  render() {
    const currentTheme = SettingsStore.getSettings().theme || 'light';
    const canInstall = Boolean(this.app && this.app.deferredInstallPrompt);

    this.element = document.createElement('div');
    this.element.className = 'view home-view active';

    this.element.innerHTML = `
      <nav class="top-nav">
        <div class="nav-inner">
          <div class="nav-left">
            <div class="nav-avatar">
              <img src="https://avatars.githubusercontent.com/codebysnorlax" alt="codebysnorlax" />
            </div>
            <span class="nav-brand">Puzzle</span>
            <span class="version-badge" title="App Version" style="font-size: 0.7rem; padding: 2px 6px; border-radius: var(--radius-sm); background: rgba(99, 102, 241, 0.15); color: var(--primary-light); font-weight: 600; border: 1px solid rgba(99, 102, 241, 0.3);">v${APP_VERSION}</span>
          </div>

          <div class="nav-center">
            <div class="diff-radio-group">
              <label class="diff-radio">
                <input type="radio" name="difficulty" value="easy" />
                <span>Easy</span>
              </label>
              <label class="diff-radio">
                <input type="radio" name="difficulty" value="normal" checked />
                <span>Medium</span>
              </label>
              <label class="diff-radio">
                <input type="radio" name="difficulty" value="hard" />
                <span>Hard</span>
              </label>
            </div>
          </div>

          <div class="nav-right">
            <button class="nav-btn nav-btn-ghost" id="btn-pwa-install-home" title="Install Application" style="display: ${canInstall ? 'inline-flex' : 'none'}; gap: 6px; font-size: 0.8rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Install</span>
            </button>

            <button class="nav-btn nav-btn-ghost" id="btn-hard-refresh-home" title="Hard Refresh App (Clear cache & fix bugs without deleting images)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>

            <button class="nav-btn nav-btn-ghost" id="btn-reset-db-nav" title="Reset Database from Fresh (Clears IndexedDB & localStorage with confirmation)" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>

            <button class="nav-btn nav-btn-ghost" id="home-theme-toggle-single" title="Toggle Theme">
              ${currentTheme === 'dark' ? `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ` : `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              `}
            </button>
            <button class="nav-btn nav-btn-solid" id="btn-start">Start Puzzle</button>
          </div>
        </div>
      </nav>

      <main class="home-main-content">
        <section class="flat-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
            <h2 class="home-section-title" style="margin-bottom: 0;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Choose Mystery Puzzle
            </h2>
            <span id="gallery-count-badge" style="font-size: 0.76rem; font-weight: 600; color: var(--text-muted);">
              23 Puzzles Available
            </span>
          </div>

          <div class="image-grid" id="image-grid"></div>

          <div id="load-more-wrap" style="display: none; justify-content: center; margin-top: var(--space-4);">
            <button class="btn btn-secondary" id="btn-load-more">Load More Puzzles</button>
          </div>
        </section>
      </main>
    `;

    this.container.appendChild(this.element);
    this.updateGalleryGrid();
    this.bindEvents();
  }

  updateGalleryGrid() {
    const grid = this.element.querySelector('#image-grid');
    if (!grid) return;

    // Put custom uploaded user images FIRST at the top!
    const fullCatalog = [...this.customImages, ...this.builtinPuzzles];
    const totalCount = fullCatalog.length;
    const visibleItems = fullCatalog.slice(0, this.displayedCount);

    const countBadge = this.element.querySelector('#gallery-count-badge');
    if (countBadge) {
      const storedCount = visibleItems.filter(i => Boolean(i.blob)).length;
      countBadge.textContent = `${visibleItems.length} Puzzles Available ${storedCount > 0 ? `• ${storedCount} Stored in DB` : ''}`;
    }

    const loadMoreWrap = this.element.querySelector('#load-more-wrap');
    if (loadMoreWrap) loadMoreWrap.style.display = this.displayedCount >= totalCount ? 'none' : 'flex';

    grid.innerHTML = `
      <!-- Upload Card FIRST -->
      <div class="image-card image-card-upload" id="upload-card">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span style="font-size: 0.74rem; font-weight: 600;">Upload</span>
        <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml" style="display: none;" />
      </div>

      ${visibleItems.map(img => {
        const isSelected = (this.selectedImageId && this.selectedImageId === img.id);
        const displaySrc = img.blob ? URL.createObjectURL(img.blob) : img.url;
        const isCachedLocally = Boolean(img.blob);
        const escapedName = escapeHtml(img.name);

        const status = PuzzleStatusStore.getStatus(img.id);
        let statusClass = '';
        if (status === 'completed') statusClass = 'status-completed';
        else if (status === 'quit') statusClass = 'status-quit';

        return `
          <div class="image-card ${isSelected ? 'selected' : ''} ${statusClass}" data-url="${displaySrc}" data-id="${escapeHtml(img.id)}" data-name="${escapedName}">
            <div class="image-card-skeleton"></div>
            <img src="${displaySrc}" alt="${escapedName}" loading="lazy" onload="this.classList.add('is-loaded'); this.previousElementSibling?.classList.add('loaded');" onerror="this.previousElementSibling?.classList.add('loaded');" />
            <div class="image-card-noise-overlay"></div>
            ${isCachedLocally ? `<div class="image-card-cached-dot ${img.isCustom ? 'custom-dot' : ''}" title="Stored Locally in IndexedDB"></div>` : ''}
            
            ${status === 'completed' ? `
              <div style="position: absolute; top: 6px; left: 6px; z-index: 6; background: #10b981; color: #fff; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;" title="Completed (Green Border)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            ` : ''}

            ${status === 'quit' ? `
              <div style="position: absolute; top: 6px; left: 6px; z-index: 6; background: #ef4444; color: #fff; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;" title="Quit / Unsolved (Red Border)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
            ` : ''}

            <div class="image-card-mystery-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Mystery
            </div>
            ${img.isCustom ? `
              <button class="image-card-delete" data-delete-id="${escapeHtml(img.id)}" title="Delete">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            ` : ''}
          </div>
        `;
      }).join('')}
    `;

    this.bindGalleryEvents();
  }

  bindGalleryEvents() {
    const grid = this.element.querySelector('#image-grid');
    if (!grid) return;

    // Instantly hide skeleton for images already cached in browser memory
    const gridImgs = grid.querySelectorAll('.image-card img');
    gridImgs.forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('is-loaded');
        if (img.previousElementSibling && img.previousElementSibling.classList.contains('image-card-skeleton')) {
          img.previousElementSibling.classList.add('loaded');
        }
      }
    });

    const cards = grid.querySelectorAll('.image-card:not(.image-card-upload)');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.image-card-delete')) return;
        grid.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        const id = card.dataset.id;
        const url = card.dataset.url;

        this.selectedImageId = id;
        this.selectedImage = url;
      });
    });

    const deleteBtns = grid.querySelectorAll('.image-card-delete');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        if (confirm('Delete this custom image?')) {
          await ImageStore.deleteImage(id);
          this.customImages = this.customImages.filter(img => img.id !== id);
          if (this.selectedImageId === id) {
            this.selectedImageId = 'demo1';
            this.selectedImage = './images/demo.webp';
          }
          this.updateGalleryGrid();
        }
      });
    });

    const uploadCard = grid.querySelector('#upload-card');
    const fileInput = grid.querySelector('#file-input');
    if (uploadCard && fileInput) {
      uploadCard.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          // Security validation check before processing or saving
          const validation = validateImageFile(file);
          if (!validation.valid) {
            alert(`Upload Failed: ${validation.error}`);
            fileInput.value = '';
            return;
          }

          try {
            const savedRecord = await ImageStore.saveImage(file, validation.sanitizedName);
            this.customImages.unshift(savedRecord);
            this.selectedImage = savedRecord.url;
            this.selectedImageId = savedRecord.id;
            this.updateGalleryGrid();
          } catch (err) {
            console.warn('[HomeView] Save custom image failed:', err);
            alert(`Failed to save image: ${err.message || 'Storage error'}`);
          }
        }
      });
    }
  }

  bindEvents() {
    const btnLoadMore = this.element.querySelector('#btn-load-more');
    if (btnLoadMore) {
      btnLoadMore.addEventListener('click', () => {
        this.displayedCount += this.chunkSize;
        this.updateGalleryGrid();
      });
    }

    // PWA Install Button Handler
    const pwaInstallBtn = this.element.querySelector('#btn-pwa-install-home');
    if (pwaInstallBtn) {
      pwaInstallBtn.addEventListener('click', async () => {
        if (this.app) {
          await this.app.promptPwaInstall();
        }
      });
    }

    // Hard Refresh Button Handler
    const hardRefreshBtn = this.element.querySelector('#btn-hard-refresh-home');
    if (hardRefreshBtn) {
      hardRefreshBtn.addEventListener('click', async () => {
        if (this.app) {
          await this.app.hardRefreshApp();
        }
      });
    }

    // Reset Database Navbar Button Handler
    const resetDbNavBtn = this.element.querySelector('#btn-reset-db-nav');
    if (resetDbNavBtn) {
      resetDbNavBtn.addEventListener('click', async () => {
        if (confirm('⚠️ ERASE ALL DATA CONFIRMATION:\n\nAre you sure you want to reset everything like a brand new user?\nThis will erase all custom images, match stats, and puzzle status tracking 100%.\n\nThis action CANNOT be undone!')) {
          resetDbNavBtn.disabled = true;
          await ImageStore.clearAllDatabaseData();
          window.location.href = window.location.origin + window.location.pathname;
        }
      });
    }

    // Theme toggle
    const singleThemeBtn = this.element.querySelector('#home-theme-toggle-single');
    if (singleThemeBtn) {
      singleThemeBtn.addEventListener('click', () => {
        const current = SettingsStore.getSettings().theme || 'light';
        const nextTheme = current === 'dark' ? 'light' : 'dark';
        SettingsStore.saveSettings({ theme: nextTheme });
        SettingsStore.applyTheme(nextTheme);
        if (this.app) this.app.onThemeChange(nextTheme);

        singleThemeBtn.innerHTML = nextTheme === 'dark' ? `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ` : `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        `;
      });
    }

    // Difficulty radio buttons
    const radios = this.element.querySelectorAll('input[name="difficulty"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.selectedDifficulty = e.target.value;
      });
    });

    // Start puzzle
    const btnStart = this.element.querySelector('#btn-start');
    btnStart.addEventListener('click', async () => {
      if (this.onStartGame) {
        let finalImage = this.selectedImage;
        const builtin = await ImageStore.getBuiltinImage(this.selectedImageId);
        if (builtin && builtin.url) {
          finalImage = builtin.url;
        }

        this.onStartGame({
          imageUrl: finalImage,
          imageId: this.selectedImageId,
          mode: 'normal',
          difficulty: this.selectedDifficulty
        });
      }
    });
  }

  show() { this.element.classList.add('active'); }
  hide() { this.element.classList.remove('active'); }
}
