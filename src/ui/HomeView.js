import { SettingsStore } from '../storage/SettingsStore.js';

/**
 * HomeView — Clean editorial menu with top Light/Dark theme toggle & capsule controls
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
      <!-- Top Header with Brand & Theme Toggle -->
      <header class="home-header">
        <div>
          <h1 class="home-title">PixelCraft PWA</h1>
          <p class="home-subtitle">Select an image & start swapping tiles</p>
        </div>

        <!-- Light / Dark Capsule Theme Switcher -->
        <div class="theme-toggle-capsule" id="home-theme-toggle" title="Toggle Light / Dark Mode">
          <div class="theme-toggle-btn ${currentTheme === 'light' ? 'active' : ''}" data-theme-val="light" title="Light Mode">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </div>
          <div class="theme-toggle-btn ${currentTheme === 'dark' ? 'active' : ''}" data-theme-val="dark" title="Dark Mode">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </div>
        </div>
      </header>

      <main>
        <!-- Flat Section 1: Image Gallery -->
        <section class="flat-section">
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

        <!-- Flat Section 2: Mode Selector -->
        <section class="flat-section">
          <h2 class="home-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Puzzle Mode
          </h2>
          <div class="options-group">
            <div class="option-chip selected" data-mode="normal">Normal (Tile Swap)</div>
            <div class="option-chip" data-mode="jigsaw">Jigsaw (Interlocking)</div>
          </div>
        </section>

        <!-- Flat Section 3: Difficulty Selector -->
        <section class="flat-section" style="border-bottom: none;">
          <h2 class="home-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Difficulty
          </h2>
          <div class="options-group" id="difficulty-group">
            <div class="option-chip" data-diff="easy">Easy (9)</div>
            <div class="option-chip selected" data-diff="normal">Normal (16)</div>
            <div class="option-chip" data-diff="hard">Hard (25)</div>
            <div class="option-chip" data-diff="expert">Expert (36)</div>
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

    // Mode selection
    const modeChips = this.element.querySelectorAll('[data-mode]');
    modeChips.forEach(chip => {
      chip.addEventListener('click', () => {
        modeChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedMode = chip.dataset.mode;
      });
    });

    // Difficulty selection
    const diffChips = this.element.querySelectorAll('[data-diff]');
    diffChips.forEach(chip => {
      chip.addEventListener('click', () => {
        diffChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedDifficulty = chip.dataset.diff;
      });
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
