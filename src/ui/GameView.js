/**
 * GameView — Active gameplay container, top HUD bar, and reference image drawer
 */
export class GameView {
  constructor(container, onBackToHome, onOpenSettings) {
    this.container = container;
    this.onBackToHome = onBackToHome;
    this.onOpenSettings = onOpenSettings;

    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'view game-view';

    this.element.innerHTML = `
      <header class="game-hud">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button class="btn btn-icon" id="hud-btn-back" title="Back to Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <span class="hud-stat" id="hud-mode-badge" style="text-transform: capitalize;">Normal</span>
        </div>

        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="hud-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span id="hud-timer">00:00</span>
          </div>

          <div class="hud-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l4 4 10-10"/></svg>
            <span id="hud-moves">0 moves</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="btn btn-icon" id="hud-btn-ref" title="Toggle Reference Image">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <button class="btn btn-icon" id="hud-btn-settings" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </header>

      <!-- Pixi Canvas Target Mount Point -->
      <div id="puzzle-canvas-container">
        <!-- Floating Reference Image Modal/Preview -->
        <div id="reference-preview" class="glass-card" style="display: none; position: absolute; bottom: 20px; right: 20px; width: 220px; padding: 0.5rem; z-index: 50;">
          <div style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); margin-bottom: 0.25rem;">Reference Image</div>
          <img id="ref-img-element" src="" alt="Reference" style="width: 100%; height: auto; border-radius: var(--radius-sm);" />
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    this.element.querySelector('#hud-btn-back').addEventListener('click', () => {
      if (this.onBackToHome) this.onBackToHome();
    });

    this.element.querySelector('#hud-btn-settings').addEventListener('click', () => {
      if (this.onOpenSettings) this.onOpenSettings();
    });

    const refBtn = this.element.querySelector('#hud-btn-ref');
    const refPreview = this.element.querySelector('#reference-preview');
    refBtn.addEventListener('click', () => {
      const isVisible = refPreview.style.display !== 'none';
      refPreview.style.display = isVisible ? 'none' : 'block';
    });
  }

  updateHUD({ mode, difficulty, timeStr, moves, distance, imageUrl }) {
    if (mode && difficulty) {
      this.element.querySelector('#hud-mode-badge').textContent = `${mode} (${difficulty})`;
    }
    if (timeStr !== undefined) {
      this.element.querySelector('#hud-timer').textContent = timeStr;
    }
    if (moves !== undefined) {
      this.element.querySelector('#hud-moves').textContent = `${moves} moves`;
    }
    if (imageUrl) {
      this.element.querySelector('#ref-img-element').src = imageUrl;
    }
  }

  getCanvasContainer() {
    return this.element.querySelector('#puzzle-canvas-container');
  }

  show() {
    this.element.classList.add('active');
  }

  hide() {
    this.element.classList.remove('active');
  }
}
