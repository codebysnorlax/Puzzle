import { SettingsStore } from '../storage/SettingsStore.js';
import { ImageStore } from '../storage/ImageStore.js';
import { APP_VERSION, BUILD_DATE, isStandalone } from '../app/AppVersion.js';

/**
 * SettingsView — User preferences, theme modal, and App Version info
 */
export class SettingsView {
  constructor(container, onClose = null, app = null) {
    this.container = container;
    this.onClose = onClose;
    this.app = app;

    this.render();
  }

  updatePwaInstallState(show) {
    const pwaSection = this.element.querySelector('#settings-pwa-install-section');
    if (pwaSection) {
      pwaSection.style.display = show ? 'flex' : 'none';
    }
  }

  render() {
    const settings = SettingsStore.getSettings();
    const isPwaStandalone = isStandalone();
    const canInstall = Boolean(this.app && this.app.deferredInstallPrompt);

    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';

    this.element.innerHTML = `
      <div class="modal-content surface-card" style="padding: var(--space-6); max-width: 480px; width: 90%;">
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
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
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

          <!-- PWA Install Banner Option -->
          <div id="settings-pwa-install-section" style="display: ${canInstall ? 'flex' : 'none'}; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem;">Install Application</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Install app to home screen for offline play</div>
            </div>
            <button class="btn btn-secondary" id="btn-pwa-install-settings" style="padding: 4px 12px; min-height: 34px; font-size: 0.8rem;">Install App</button>
          </div>

          <!-- Database Cleaner / Reset Fresh Option -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; color: #ef4444;">Reset Database</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Reset app from fresh (confirmation required)</div>
            </div>
            <button class="btn" id="btn-reset-db-settings" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 12px; min-height: 34px; font-size: 0.8rem;">Reset Data</button>
          </div>

          <!-- App Version & PWA Runtime Status -->
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; margin-top: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 6px;">
              <span style="color: var(--text-muted);">App Version:</span>
              <span style="font-weight: 600; color: var(--primary-light);">v${APP_VERSION} (${BUILD_DATE})</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 6px;">
              <span style="color: var(--text-muted);">Display Mode:</span>
              <span style="font-weight: 500; color: var(--text-main);">${isPwaStandalone ? 'Standalone PWA App' : 'Browser Web App'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
              <span style="color: var(--text-muted);">Storage & Cache:</span>
              <span style="font-weight: 500; color: var(--text-main);">IndexedDB Local-First</span>
            </div>
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
      if (this.app) this.app.onThemeChange('dark');
    });

    lightBtn.addEventListener('click', () => {
      this.selectedTheme = 'light';
      lightBtn.className = 'btn btn-primary';
      darkBtn.className = 'btn btn-secondary';
      SettingsStore.applyTheme('light');
      if (this.app) this.app.onThemeChange('light');
    });

    const pwaInstallSettingsBtn = this.element.querySelector('#btn-pwa-install-settings');
    if (pwaInstallSettingsBtn) {
      pwaInstallSettingsBtn.addEventListener('click', async () => {
        if (this.app) {
          await this.app.promptPwaInstall();
        }
      });
    }

    const resetDbBtn = this.element.querySelector('#btn-reset-db-settings');
    if (resetDbBtn) {
      resetDbBtn.addEventListener('click', async () => {
        if (confirm('⚠️ ERASE ALL DATA CONFIRMATION:\n\nAre you sure you want to reset everything like a brand new user?\nThis will erase all custom images, match stats, and puzzle status tracking 100%.\n\nThis action CANNOT be undone!')) {
          resetDbBtn.disabled = true;
          await ImageStore.clearAllDatabaseData();
          window.location.href = window.location.origin + window.location.pathname;
        }
      });
    }

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
