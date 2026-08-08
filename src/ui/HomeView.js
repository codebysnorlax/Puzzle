import { SettingsStore } from '../storage/SettingsStore.js';
import { ImageStore } from '../storage/ImageStore.js';

/**
 * HomeView — Clean editorial menu with IndexedDB image persistence & manual deletion
 */
export class HomeView {
  constructor(container, onStartGame) {
    this.container = container;
    this.onStartGame = onStartGame;

    // Built-in local sample images
    this.sampleImages = [
      { id: 'demo1', name: 'Mountain Landscape', url: './puzzles/demo.jpg', isCustom: false },
      { id: 'demo2', name: 'Scenic Sunset', url: './puzzles/demo2.jpg', isCustom: false },
      { id: 'snorlax', name: 'Snorlax', url: './puzzles/snorlax.png', isCustom: false },
      { id: 'test', name: 'Vibrant Artwork', url: './puzzles/test.jpg', isCustom: false }
    ];

    this.customImages = [];
    this.selectedImage = this.sampleImages[0].url;
    this.selectedMode = 'normal'; // Default: Normal Rectangular Grid Swap
    this.selectedDifficulty = 'normal'; // 'easy', 'normal', 'hard', 'expert'

    this.render();
    this.loadCustomImages();
  }

  async loadCustomImages() {
    try {
      this.customImages = await ImageStore.getAllImages();
      this.updateGalleryGrid();
    } catch (err) {
      console.warn('[HomeView] Failed to load custom images from IndexedDB:', err);
    }
  }

  render() {
    const currentTheme = SettingsStore.getSettings().theme || 'light';

    this.element = document.createElement('div');
    this.element.className = 'view home-view active';

    this.element.innerHTML = `
      <!-- Top Header Navbar with Centered Start CTA -->
      <header class="home-header">
        <div class="nav-left">
          <h1 class="home-title">PixelCraft PWA</h1>
        </div>

        <!-- Center: Prominent Start Capsule CTA -->
        <div class="nav-center">
          <button class="btn btn-primary nav-start-btn" id="btn-start">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start Puzzle
          </button>
        </div>

        <div class="nav-right">
          <!-- Desktop Navbar Dropdown Selectors -->
          <div class="nav-select-group">
            <div class="custom-select-wrap">
              <select class="nav-select" id="nav-mode-select" title="Puzzle Mode">
                <option value="normal" selected>Mode: Normal (Grid Swap)</option>
                <option value="jigsaw">Mode: Jigsaw (Interlocking)</option>
              </select>
            </div>

            <div class="custom-select-wrap">
              <select class="nav-select" id="nav-diff-select" title="Difficulty Level">
                <option value="easy">Diff: Easy (9)</option>
                <option value="normal" selected>Diff: Normal (16)</option>
                <option value="hard">Diff: Hard (25)</option>
                <option value="expert">Diff: Expert (36)</option>
              </select>
            </div>
          </div>

          <!-- Light / Dark Capsule Theme Switcher -->
          <div class="theme-toggle-capsule" id="home-theme-toggle" title="Toggle Light / Dark Mode">
            <div class="theme-toggle-btn ${currentTheme === 'light' ? 'active' : ''}" data-theme-val="light" title="Light Mode">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </div>
            <div class="theme-toggle-btn ${currentTheme === 'dark' ? 'active' : ''}" data-theme-val="dark" title="Dark Mode">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </div>
          </div>

          <!-- Mobile Hamburger Toggle Button -->
          <div class="hamburger-btn-wrap">
            <button class="btn btn-icon" id="btn-hamburger" title="Open Controls Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Section: Image Gallery -->
      <main>
        <section class="flat-section">
          <h2 class="home-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Choose Image
          </h2>
          <div class="image-grid" id="image-grid">
            <!-- Grid cards populated dynamically in updateGalleryGrid -->
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

    const allImages = [...this.sampleImages, ...this.customImages];

    grid.innerHTML = `
      ${allImages.map(img => `
        <div class="image-card ${this.selectedImage === img.url || this.selectedImage === img.blob ? 'selected' : ''}" data-url="${img.url}" data-id="${img.id}">
          <img src="${img.url}" alt="${img.name}" />
          ${img.isCustom ? `
            <button class="image-card-delete" data-delete-id="${img.id}" title="Delete Custom Image">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          ` : ''}
        </div>
      `).join('')}

      <div class="image-card image-card-upload" id="upload-card">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span style="font-size: 0.78rem; font-weight: 600;">Upload</span>
        <input type="file" id="file-input" accept="image/*" style="display: none;" />
      </div>
    `;

    this.bindGalleryEvents();
  }

  bindGalleryEvents() {
    const grid = this.element.querySelector('#image-grid');
    if (!grid) return;

    // Image card selection
    const cards = grid.querySelectorAll('.image-card:not(.image-card-upload)');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.image-card-delete')) return; // Ignore if delete button clicked

        grid.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        const customImg = this.customImages.find(c => c.id === card.dataset.id);
        if (customImg) {
          this.selectedImage = customImg.blob; // Pass Blob directly to ImageProcessor
        } else {
          this.selectedImage = card.dataset.url;
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
          if (this.selectedImage && typeof this.selectedImage !== 'string') {
            this.selectedImage = this.sampleImages[0].url;
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
            this.selectedImage = savedRecord.blob;
            this.updateGalleryGrid();
          } catch (err) {
            console.error('[HomeView] Failed to save image into IndexedDB:', err);
          }
        }
      });
    }
  }

  bindEvents() {
    // Theme toggle
    const toggleBtns = this.element.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetTheme = btn.dataset.themeVal;
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        SettingsStore.saveSettings({ theme: targetTheme });
        SettingsStore.applyTheme(targetTheme);
      });
    });

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
    btnStart.addEventListener('click', () => {
      if (this.onStartGame) {
        this.onStartGame({
          imageUrl: this.selectedImage || this.sampleImages[0].url,
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
