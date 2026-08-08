/**
 * HomeView — Main menu & image / mode / difficulty configuration view
 */
export class HomeView {
  constructor(container, onStartGame) {
    this.container = container;
    this.onStartGame = onStartGame;

    // Built-in image assets located in public/puzzles/
    this.sampleImages = [
      { id: 'demo1', name: 'Mountain Landscape', url: './puzzles/demo.jpg' },
      { id: 'demo2', name: 'Scenic Sunset', url: './puzzles/demo2.jpg' },
      { id: 'snorlax', name: 'Snorlax', url: './puzzles/snorlax.png' },
      { id: 'test', name: 'Vibrant Artwork', url: './puzzles/test.jpg' }
    ];

    this.selectedImage = this.sampleImages[0].url;
    this.selectedMode = 'normal'; // 'normal' | 'jigsaw'
    this.selectedDifficulty = 'normal'; // 'easy', 'normal', 'hard', 'expert'

    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'view home-view active';

    this.element.innerHTML = `
      <header class="home-header">
        <h1 class="home-title">PixelCraft PWA</h1>
        <p class="home-subtitle">High Performance Local-First Image Puzzle</p>
      </header>

      <main>
        <!-- Image Selector Section -->
        <section class="surface-card" style="margin-bottom: var(--space-6);">
          <h2 class="home-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            Choose Puzzle Image
          </h2>
          <div class="image-grid" id="image-grid">
            ${this.sampleImages.map((img, idx) => `
              <div class="image-card ${idx === 0 ? 'selected' : ''}" data-url="${img.url}">
                <img src="${img.url}" alt="${img.name}" />
              </div>
            `).join('')}
            <div class="image-card image-card-upload" id="upload-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span style="font-size: 0.78rem; font-weight: 600;">Upload</span>
              <input type="file" id="file-input" accept="image/*" style="display: none;" />
            </div>
          </div>
        </section>

        <!-- Mode & Difficulty Selection -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-5); margin-bottom: var(--space-6);">
          <!-- Mode Picker -->
          <section class="surface-card">
            <h2 class="home-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Puzzle Mode
            </h2>
            <div class="options-group">
              <div class="option-chip selected" data-mode="normal">
                <div class="option-chip-title">Normal</div>
                <div class="option-chip-desc">Rectangular Grid Swap</div>
              </div>
              <div class="option-chip" data-mode="jigsaw">
                <div class="option-chip-title">Jigsaw</div>
                <div class="option-chip-desc">Interlocking Tabs</div>
              </div>
            </div>
          </section>

          <!-- Difficulty Picker -->
          <section class="surface-card">
            <h2 class="home-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Difficulty
            </h2>
            <div class="options-group" id="difficulty-group">
              <div class="option-chip" data-diff="easy">
                <div class="option-chip-title">Easy</div>
                <div class="option-chip-desc">~9 pieces</div>
              </div>
              <div class="option-chip selected" data-diff="normal">
                <div class="option-chip-title">Normal</div>
                <div class="option-chip-desc">~16 pieces</div>
              </div>
              <div class="option-chip" data-diff="hard">
                <div class="option-chip-title">Hard</div>
                <div class="option-chip-desc">~25 pieces</div>
              </div>
              <div class="option-chip" data-diff="expert">
                <div class="option-chip-title">Expert</div>
                <div class="option-chip-desc">~36 pieces</div>
              </div>
            </div>
          </section>
        </div>

        <!-- Start CTA -->
        <div style="text-align: center; margin-top: var(--space-4);">
          <button class="btn btn-primary" id="btn-start" style="padding: var(--space-4) var(--space-10); font-size: 1rem;">
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
    // Image selection
    const imageCards = this.element.querySelectorAll('.image-card:not(.image-card-upload)');
    imageCards.forEach(card => {
      card.addEventListener('click', () => {
        this.element.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedImage = card.dataset.url;
      });
    });

    // File upload
    const uploadCard = this.element.querySelector('#upload-card');
    const fileInput = this.element.querySelector('#file-input');

    uploadCard.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedImage = file;
        const objectUrl = URL.createObjectURL(file);
        
        // Add preview card
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

    // Start button
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
