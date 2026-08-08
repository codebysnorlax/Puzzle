/**
 * HomeView — Main menu & image / mode / difficulty configuration view
 */

// Helper to create SVG data URLs for 100% offline reliable built-in sample images
function createSvgDataUrl(svgString) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
}

const SAMPLE_1 = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#312e81" />
      <stop offset="100%" stop-color="#581c87" />
    </linearGradient>
    <radialGradient id="g2" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#818cf8" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#c084fc" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g3" cx="70%" cy="70%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g1)" />
  <circle cx="320" cy="240" r="280" fill="url(#g2)" />
  <circle cx="560" cy="420" r="220" fill="url(#g3)" />
  <g fill="#ffffff" opacity="0.8">
    <circle cx="100" cy="80" r="3"/><circle cx="250" cy="140" r="2"/><circle cx="450" cy="90" r="3.5"/><circle cx="680" cy="120" r="2.5"/>
    <circle cx="150" cy="380" r="2.5"/><circle cx="720" cy="310" r="3"/><circle cx="380" cy="520" r="2"/><circle cx="620" cy="500" r="3"/>
  </g>
  <text x="400" y="320" font-family="sans-serif" font-size="42" font-weight="bold" fill="#ffffff" text-anchor="middle" opacity="0.9">Cosmic Nebula</text>
</svg>
`);

const SAMPLE_2 = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="fg1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#fg1)" />
  <polygon points="0,600 200,300 400,600" fill="#065f46" opacity="0.8"/>
  <polygon points="250,600 480,220 700,600" fill="#047857" opacity="0.9"/>
  <polygon points="500,600 650,340 800,600" fill="#0f766e" opacity="0.7"/>
  <circle cx="400" cy="160" r="70" fill="#fde047" opacity="0.85"/>
  <text x="400" y="520" font-family="sans-serif" font-size="42" font-weight="bold" fill="#ffffff" text-anchor="middle" opacity="0.95">Emerald Forest</text>
</svg>
`);

const SAMPLE_3 = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="sg1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="50%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#sg1)" />
  <polygon points="-50,600 150,280 350,600" fill="#312e81" opacity="0.9"/>
  <polygon points="180,600 420,180 660,600" fill="#1e1b4b" opacity="0.95"/>
  <polygon points="450,600 680,300 900,600" fill="#4338ca" opacity="0.8"/>
  <circle cx="420" cy="180" r="12" fill="#ffffff" opacity="0.9"/>
  <text x="400" y="520" font-family="sans-serif" font-size="42" font-weight="bold" fill="#ffffff" text-anchor="middle" opacity="0.95">Sunset Peaks</text>
</svg>
`);

const SAMPLE_4 = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="cg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="50%" stop-color="#3f3f46" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#cg1)" />
  <rect x="100" y="200" width="120" height="400" fill="#27272a" stroke="#06b6d4" stroke-width="2"/>
  <rect x="260" y="140" width="160" height="460" fill="#18181b" stroke="#ec4899" stroke-width="2"/>
  <rect x="460" y="240" width="140" height="360" fill="#27272a" stroke="#a855f7" stroke-width="2"/>
  <rect x="640" y="180" width="100" height="420" fill="#18181b" stroke="#3b82f6" stroke-width="2"/>
  <text x="400" y="100" font-family="sans-serif" font-size="42" font-weight="bold" fill="#06b6d4" text-anchor="middle">Neon Cyberpunk</text>
</svg>
`);

export class HomeView {
  constructor(container, onStartGame) {
    this.container = container;
    this.onStartGame = onStartGame;

    this.sampleImages = [
      { id: 'sample1', name: 'Cosmic Nebula', url: SAMPLE_1 },
      { id: 'sample2', name: 'Emerald Forest', url: SAMPLE_2 },
      { id: 'sample3', name: 'Sunset Peaks', url: SAMPLE_3 },
      { id: 'sample4', name: 'Neon Cyberpunk', url: SAMPLE_4 }
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
        <section class="glass-card" style="margin-bottom: 1.5rem;">
          <h2 class="home-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            Choose Puzzle Image
          </h2>
          <div class="image-grid" id="image-grid">
            ${this.sampleImages.map((img, idx) => `
              <div class="image-card ${idx === 0 ? 'selected' : ''}" data-url="${img.url}">
                <img src="${img.url}" alt="${img.name}" />
              </div>
            `).join('')}
            <div class="image-card image-card-upload" id="upload-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span style="font-size: 0.8rem; font-weight: 600;">Upload</span>
              <input type="file" id="file-input" accept="image/*" style="display: none;" />
            </div>
          </div>
        </section>

        <!-- Mode & Difficulty Selection -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
          <!-- Mode Picker -->
          <section class="glass-card">
            <h2 class="home-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
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
          <section class="glass-card">
            <h2 class="home-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
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
        <div style="text-align: center; margin-top: 1rem;">
          <button class="btn btn-primary" id="btn-start" style="padding: 1rem 3rem; font-size: 1.1rem;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
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
    const updateSelectedImage = (url) => {
      this.selectedImage = url;
    };

    const imageCards = this.element.querySelectorAll('.image-card:not(.image-card-upload)');
    imageCards.forEach(card => {
      card.addEventListener('click', () => {
        this.element.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        updateSelectedImage(card.dataset.url);
      });
    });

    // File upload
    const uploadCard = this.element.querySelector('#upload-card');
    const fileInput = this.element.querySelector('#file-input');

    uploadCard.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Use File object directly or object URL
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
