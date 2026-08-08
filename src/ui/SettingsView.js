import { SettingsStore } from '../storage/SettingsStore.js';

/**
 * SettingsView — User preferences and theme modal
 */
export class SettingsView {
  constructor(container, onClose) {
    this.container = container;
    this.onClose = onClose;

    this.render();
  }

  render() {
    const settings = SettingsStore.getSettings();

    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';

    this.element.innerHTML = `
      <div class="modal-content surface-card" style="padding: var(--space-6);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5);">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main);">Settings</h2>
          <button class="btn btn-icon" id="btn-close-settings" title="Close Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: var(--space-4);">
          <!-- Theme Preference -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem;">Appearance Theme</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Switch between Dark Slate and Light themes</div>
            </div>
            <div class="options-group" style="margin-bottom: 0; gap: 4px;">
              <button class="btn btn-secondary ${settings.theme === 'dark' ? 'btn-primary' : ''}" id="btn-theme-dark" style="padding: 4px 12px; min-height: 36px; font-size: 0.8rem;">Dark</button>
              <button class="btn btn-secondary ${settings.theme === 'light' ? 'btn-primary' : ''}" id="btn-theme-light" style="padding: 4px 12px; min-height: 36px; font-size: 0.8rem;">Light</button>
            </div>
          </div>

          <!-- Sound Preference -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem;">Sound Effects</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Tile snap and completion audio</div>
            </div>
            <input type="checkbox" id="setting-sound" ${settings.sound ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--primary);" />
          </div>

          <!-- Snap Sensitivity -->
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem;">Snap Sensitivity</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Distance threshold for snapping</div>
            </div>
            <select id="setting-snap" style="background: var(--bg-surface); color: var(--text-main); padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 0.85rem;">
              <option value="normal" ${settings.snapSensitivity === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="strict" ${settings.snapSensitivity === 'strict' ? 'selected' : ''}>Strict</option>
              <option value="relaxed" ${settings.snapSensitivity === 'relaxed' ? 'selected' : ''}>Relaxed</option>
            </select>
          </div>
        </div>

        <div style="margin-top: var(--space-6); text-align: right;">
          <button class="btn btn-primary" id="btn-save-settings">Save & Close</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.selectedTheme = settings.theme || 'dark';
    this.bindEvents();
  }

  bindEvents() {
    const darkBtn = this.element.querySelector('#btn-theme-dark');
    const lightBtn = this.element.querySelector('#btn-theme-light');

    darkBtn.addEventListener('click', () => {
      this.selectedTheme = 'dark';
      darkBtn.className = 'btn btn-primary';
      lightBtn.className = 'btn btn-secondary';
      SettingsStore.applyTheme('dark');
    });

    lightBtn.addEventListener('click', () => {
      this.selectedTheme = 'light';
      lightBtn.className = 'btn btn-primary';
      darkBtn.className = 'btn btn-secondary';
      SettingsStore.applyTheme('light');
    });

    const close = () => {
      const sound = this.element.querySelector('#setting-sound').checked;
      const snap = this.element.querySelector('#setting-snap').value;

      SettingsStore.saveSettings({
        theme: this.selectedTheme,
        sound,
        snapSensitivity: snap
      });

      this.hide();
      if (this.onClose) this.onClose();
    };

    this.element.querySelector('#btn-close-settings').addEventListener('click', close);
    this.element.querySelector('#btn-save-settings').addEventListener('click', close);
  }

  show() {
    this.element.classList.add('active');
  }

  hide() {
    this.element.classList.remove('active');
  }
}
