import { SettingsStore } from '../storage/SettingsStore.js';

/**
 * HomeView — Clean editorial menu with Navbar Dropdowns & Mobile Hamburger Drawer
 */
export class HomeView {
  constructor(container, onStartGame) {
    this.container = container;
    this.onStartGame = onStartGame;

    // Built-in local image assets
    this.sampleImages = [
      { id: 'demo1', name: 'Mountain Landscape', url: './puzzles/demo.jpg' },
      { id: 'demo2', name: 'Scenic Sunset', url: './puzzles/demo2.jpg' },
      { id: 'snorlax', name: 'Snorlax', url: './puzzles/snorlax.png' },
      { id: 'test', name: 'Vibrant Artwork', url: './puzzles/test.jpg' }
    ];

    this.selectedImage = this.sampleImages[0].url;
    this.selectedMode = 'normal'; // Default: Normal Rectangular Grid Swap
    this.selectedDifficulty = 'normal'; // 'easy', 'normal', 'hard', 'expert'

    this.render();
  }

  render() {
    const currentTheme = SettingsStore.getSettings().theme || 'light';

    this.element = document.createElement('div');
    this.element.className = 'view home-view active';

    this.element.innerHTML = `
      <!-- Top Header Navbar -->
      <header class="home-header">
        <div>
          <h1 class="home-title">PixelCraft PWA</h1>
          <p class="home-subtitle">Local-First Image Puzzle</p>
        </div>

        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <!-- Desktop Navbar Dropdown Selectors -->
          <div class="nav-select-group">
            <select class="nav-select" id="nav-mode-select" title="Puzzle Mode">
              <option value="normal" selected>Mode: Normal (Grid Swap)</option>
              <option value="jigsaw">Mode: Jigsaw (Interlocking)</option>
            </select>

            <select class="nav-select" id="nav-diff-select" title="Difficulty Level">
              <option value="easy">Diff: Easy (9)</option>
              <option value="normal" selected>Diff: Normal (16)</option>
              <option value="hard">Diff: Hard (25)</option>
              <option value="expert">Diff: Expert (36)</option>
            </select>
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

      <!-- Main Section: Image Gallery & Start Button -->
      <main>
        <section class="flat-section" style="border-bottom: none;">
          <h2 class="home-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Choose Image
          </h2>
          <div class="image-grid" id="image-grid">
            ${this.sampleImages.map((img, idx) => `
              <div class="image-card ${idx === 0 ? 'selected' : ''}" data-url="${img.url}">
                <img src="${img.url}" alt="${img.name}" />
              </div>
            `).join('')}
            <div class="image-card image-card-upload" id="upload-card">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span style="font-size: 0.78rem; font-weight: 600;">Upload</span>
              <input type="file" id="file-input" accept="image/*" style="display: none;" />
            </div>
          </div>
        </section>

        <!-- Start Capsule Button -->
        <div style="text-align: center; margin-top: var(--space-6);">
          <button class="btn btn-primary" id="btn-start" style="padding: 0 var(--space-10); min-height: 44px; font-size: 0.95rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start Puzzle
          </button>
        </div>
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
            <select class="nav-select" id="mobile-mode-select" style="width: 100%; height: 40px;">
              <option value="normal" selected>Normal (Grid Swap)</option>
              <option value="jigsaw">Jigsaw (Interlocking)</option>
            </select>

            <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-top: var(--space-2);">Difficulty Level</label>
            <select class="nav-select" id="mobile-diff-select" style="width: 100%; height: 40px;">
              <option value="easy">Easy (9)</option>
              <option value="normal" selected>Normal (16)</option>
              <option value="hard">Hard (25)</option>
              <option value="expert">Expert (36)</option>
            </select>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
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

    // Image selection
    const imageCards = this.element.querySelectorAll('.image-card:not(.image-card-upload)');
    imageCards.forEach(card => {
      card.addEventListener('click', () => {
        this.element.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedImage = card.dataset.url;
      });
    });

    // Custom upload
    const uploadCard = this.element.querySelector('#upload-card');
    const fileInput = this.element.querySelector('#file-input');

    uploadCard.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedImage = file;
        const objectUrl = URL.createObjectURL(file);
        
        const newCard = document.createElement('div');
        newCard.className = 'image-card selected';
        newCard.innerHTML = `<img src="${objectUrl}" alt="Uploaded" />`;
        
        this.element.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
        const grid = this.element.querySelector('#image-grid');
        grid.insertBefore(newCard, uploadCard);
        
        newCard.addEventListener('click', () => {
          this.element.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
          newCard.classList.add('selected');
          this.selectedImage = file;
        });
      }
    });

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
