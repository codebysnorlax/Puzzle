import { SettingsStore } from '../storage/SettingsStore.js';
import { ImageStore } from '../storage/ImageStore.js';
import { APP_VERSION, BUILD_DATE, isStandalone } from '../app/AppVersion.js';
import { VisitorTracker } from '../services/VisitorTracker.js';

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
      <div class="modal-content surface-card settings-modal" style="padding: var(--space-4); max-width: 440px; width: 92%; max-height: 92vh; overflow-y: auto; background: rgba(var(--modal-bg-rgb), 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); position: sticky; top: 0; z-index: 10; background: inherit; padding-bottom: var(--space-2);">
          <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin: 0;">Settings</h2>
          <button class="btn btn-icon settings-close-btn" id="btn-close-settings" title="Close Settings" style="width: 28px; height: 28px; min-width: 28px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-hover); border: 1px solid var(--border-subtle);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <!-- Theme Preference -->
          <div class="settings-row">
            <div class="settings-label">
              <div style="font-weight: 600; font-size: 0.85rem;">Appearance</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Theme preference</div>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-secondary settings-theme-btn ${settings.theme === 'dark' ? 'btn-primary' : ''}" id="btn-theme-dark" style="padding: 4px 10px; height: 30px; font-size: 0.75rem;">Dark</button>
              <button class="btn btn-secondary settings-theme-btn ${settings.theme === 'light' ? 'btn-primary' : ''}" id="btn-theme-light" style="padding: 4px 10px; height: 30px; font-size: 0.75rem;">Light</button>
            </div>
          </div>

          <!-- Sound Preference -->
          <div class="settings-row">
            <div class="settings-label">
              <div style="font-weight: 600; font-size: 0.85rem;">Sound Effects</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Tile snap & completion audio</div>
            </div>
            <input type="checkbox" id="setting-sound" ${settings.sound ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;" />
          </div>

          <!-- Snap Sensitivity -->
          <div class="settings-row">
            <div class="settings-label">
              <div style="font-weight: 600; font-size: 0.85rem;">Snap Sensitivity</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Distance threshold</div>
            </div>
            <select id="setting-snap" style="background: var(--bg-surface); color: var(--text-main); padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 0.8rem; height: 30px; cursor: pointer;">
              <option value="normal" ${settings.snapSensitivity === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="strict" ${settings.snapSensitivity === 'strict' ? 'selected' : ''}>Strict</option>
              <option value="relaxed" ${settings.snapSensitivity === 'relaxed' ? 'selected' : ''}>Relaxed</option>
            </select>
          </div>

          <!-- PWA Install -->
          <div id="settings-pwa-install-section" class="settings-row" style="display: ${canInstall ? 'flex' : 'none'};">
            <div class="settings-label">
              <div style="font-weight: 600; font-size: 0.85rem;">Install App</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Offline play</div>
            </div>
            <button class="btn btn-secondary" id="btn-pwa-install-settings" style="padding: 4px 10px; height: 30px; font-size: 0.75rem;">Install</button>
          </div>

          <!-- Reset Database -->
          <div class="settings-row">
            <div class="settings-label">
              <div style="font-weight: 600; font-size: 0.85rem; color: #ef4444;">Reset Database</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Erase all data</div>
            </div>
            <button class="btn" id="btn-reset-db-settings" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 10px; height: 30px; font-size: 0.75rem;">Reset</button>
          </div>

          <!-- Divider -->
          <div style="height: 1px; background: var(--border-subtle); margin: var(--space-2) 0;"></div>

          <!-- Visitor Analytics -->
          <div class="settings-info-card" style="background: rgba(var(--card-bg-rgb), 0.5); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-3);">
            <div style="font-weight: 700; font-size: 0.8rem; margin-bottom: var(--space-2); color: var(--text-main); display: flex; align-items: center; gap: 5px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Visitor Analytics
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem; margin-bottom: 5px;">
              <span style="color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Unique:
              </span>
              <span id="settings-unique-count" class="count-animated" style="font-weight: 700; color: var(--primary);">...</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem;">
              <span style="color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Total Visits:
              </span>
              <span id="settings-total-count" class="count-animated" style="font-weight: 700; color: var(--text-main);">...</span>
            </div>
          </div>

          <!-- App Version -->
          <div class="settings-info-card" style="background: rgba(var(--card-bg-rgb), 0.3); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-3);">
            <div style="display: flex; justify-content: space-between; font-size: 0.76rem; margin-bottom: 5px;">
              <span style="color: var(--text-muted);">Version:</span>
              <span style="font-weight: 600; color: var(--primary);">v${APP_VERSION}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.76rem; margin-bottom: 5px;">
              <span style="color: var(--text-muted);">Display:</span>
              <span style="font-weight: 500; color: var(--text-main);">${isPwaStandalone ? 'PWA' : 'Browser'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.76rem;">
              <span style="color: var(--text-muted);">Storage:</span>
              <span style="font-weight: 500; color: var(--text-main);">IndexedDB</span>
            </div>
          </div>
        </div>

        <div style="margin-top: var(--space-4); display: flex; justify-content: flex-end; gap: var(--space-2);">
          <button class="btn btn-primary" id="btn-save-settings" style="padding: 6px 16px; height: 32px; font-size: 0.8rem;">Save & Close</button>
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
          alert('✅ Reset Complete! The app will now reload.');
          window.location.reload();
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
    VisitorTracker.recordAndGetStats().then(stats => {
      const uEl = this.element.querySelector('#settings-unique-count');
      const tEl = this.element.querySelector('#settings-total-count');
      if (uEl) VisitorTracker.updateElementWithAnimation(uEl, stats.uniqueFormatted);
      if (tEl) VisitorTracker.updateElementWithAnimation(tEl, stats.totalFormatted);
    }).catch(e => {});
  }

  hide() {
    this.element.classList.remove('active');
  }
}
