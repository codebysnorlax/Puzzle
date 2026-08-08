import { SettingsStore } from '../storage/SettingsStore.js';

/**
 * GameView — Active gameplay container with compact top HUD header bar & Light/Dark theme switcher
 */
export class GameView {
  constructor(container, { onBackToHome, onOpenSettings, onRestartGame }) {
    this.container = container;
    this.onBackToHome = onBackToHome;
    this.onOpenSettings = onOpenSettings;
    this.onRestartGame = onRestartGame;

    this.render();
  }

  render() {
    const currentTheme = SettingsStore.getSettings().theme || 'light';

    this.element = document.createElement('div');
    this.element.className = 'view game-view';

    this.element.innerHTML = `
      <!-- Compact Top Header HUD Toolbar -->
      <header class="game-hud">
        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <button class="btn btn-icon" id="hud-btn-back" title="Back to Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <span class="hud-stat" id="hud-mode-badge" style="text-transform: capitalize; font-size: 0.8rem; font-weight: 600;">Normal</span>
        </div>

        <div class="hud-stat-group">
          <div class="hud-stat" title="Timer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span id="hud-timer">00:00</span>
          </div>

          <div class="hud-stat" title="Total Moves">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l4 4 10-10"/></svg>
            <span id="hud-moves">0 moves</span>
          </div>

          <div class="hud-stat" title="Total Distance">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span id="hud-dist">0 px</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <!-- Direct Light/Dark Theme Switcher -->
          <div class="theme-toggle-capsule" id="game-theme-toggle" title="Toggle Light / Dark Mode">
            <div class="theme-toggle-btn ${currentTheme === 'light' ? 'active' : ''}" data-theme-val="light" title="Light Mode">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </div>
            <div class="theme-toggle-btn ${currentTheme === 'dark' ? 'active' : ''}" data-theme-val="dark" title="Dark Mode">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </div>
          </div>

          <button class="btn btn-icon" id="hud-btn-ref" title="Toggle Reference Image">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <button class="btn btn-icon" id="hud-btn-restart" title="Restart Puzzle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </button>
          <button class="btn btn-icon" id="hud-btn-settings" title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </header>

      <!-- Pixi Canvas Target Viewport -->
      <div id="puzzle-canvas-container">
        <!-- Floating Reference Image Preview -->
        <div id="reference-preview" class="surface-card" style="display: none; position: absolute; bottom: 16px; right: 16px; width: 180px; padding: var(--space-2); z-index: 50;">
          <div style="font-size: 0.72rem; font-weight: 600; color: var(--text-muted); margin-bottom: var(--space-1);">Reference Image</div>
          <img id="ref-img-element" src="" alt="Reference" style="width: 100%; height: auto; border-radius: var(--radius-sm);" />
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

    this.element.querySelector('#hud-btn-back').addEventListener('click', () => {
      if (this.onBackToHome) this.onBackToHome();
    });

    this.element.querySelector('#hud-btn-restart').addEventListener('click', () => {
      if (this.onRestartGame) this.onRestartGame();
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
    if (distance !== undefined) {
      this.element.querySelector('#hud-dist').textContent = `${distance} px`;
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
