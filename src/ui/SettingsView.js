import { SettingsStore } from "../storage/SettingsStore.js";
import { ImageStore } from "../storage/ImageStore.js";
import { dbManager } from "../storage/IndexedDB.js";
import { APP_VERSION, BUILD_DATE, isStandalone } from "../app/AppVersion.js";
import { VisitorTracker } from "../services/VisitorTracker.js";

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
    const pwaSection = this.element.querySelector(
      "#settings-pwa-install-section",
    );
    if (pwaSection) {
      pwaSection.style.display = show ? "flex" : "none";
    }
  }

  render() {
    const settings = SettingsStore.getSettings();
    const isPwaStandalone = isStandalone();
    const canInstall = Boolean(this.app && this.app.deferredInstallPrompt);

    this.element = document.createElement("div");
    this.element.className = "modal-overlay";

    this.element.innerHTML = `
      <div class="modal-content surface-card settings-modal">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px dashed var(--border-subtle);">
          <h2 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin: 0;">Settings</h2>
          <button class="settings-close-btn" id="btn-close-settings" title="Close Settings" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; color: var(--text-muted);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Sound Preference -->
          <div class="settings-row">
            <div class="settings-label">
              <div>Sound Effects</div>
              <div>Tile snap & completion audio</div>
            </div>
            <input type="checkbox" id="setting-sound" ${settings.sound ? "checked" : ""} style="width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer;" />
          </div>

          <!-- Game Assistant Toasts -->
          <div class="settings-row">
            <div class="settings-label">
              <div>Game Assistant</div>
              <div>Roasts, tips & idle warnings</div>
            </div>
            <input type="checkbox" id="setting-assistant" ${settings.assistantToasts !== false ? "checked" : ""} style="width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer;" />
          </div>

          <!-- Snap Sensitivity & Piece Border Color in 1 Row -->
          <div class="settings-row settings-row-split">
            <div style="display: flex; flex: 1; flex-direction: column; gap: 4px;">
              <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-main); text-align: left;">Snap Sensitivity</div>
              <select id="setting-snap" style="background: var(--bg-hover); color: var(--text-main); padding: 2px 6px; border-radius: var(--radius-sm); border: 1px dashed var(--border-subtle); font-size: 0.72rem; height: 24px; cursor: pointer; width: 100%;">
                <option value="normal" ${settings.snapSensitivity === "normal" ? "selected" : ""}>Normal</option>
                <option value="strict" ${settings.snapSensitivity === "strict" ? "selected" : ""}>Strict</option>
                <option value="relaxed" ${settings.snapSensitivity === "relaxed" ? "selected" : ""}>Relaxed</option>
              </select>
            </div>

            <div style="display: flex; flex: 1; flex-direction: column; gap: 4px; align-items: flex-start;">
              <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-main); white-space: nowrap; text-align: left;">Border Color</div>
              <div style="display: flex; gap: 6px; align-items: center; width: 100%;">
                <input type="color" id="setting-border-color" value="${settings.borderColor && settings.borderColor !== 'transparent' ? settings.borderColor : '#64748b'}" ${settings.borderTransparent ? 'disabled' : ''} style="width: 50px; height: 24px; padding: 0 2px; border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm); background: var(--bg-hover); cursor: pointer; box-sizing: border-box;" />
                <label style="display: flex; align-items: center; gap: 3px; font-size: 0.72rem; color: var(--text-main); cursor: pointer; white-space: nowrap;">
                  <input type="checkbox" id="setting-border-transparent" ${settings.borderTransparent ? "checked" : ""} style="width: 12px; height: 12px; margin: 0; cursor: pointer;" />
                  Transparent
                </label>
              </div>
            </div>
          </div>

          <!-- Hint Cooldown & Smart Hint Tokens -->
          <div class="settings-row settings-row-split">
            <div style="display: flex; flex: 1; flex-direction: column; gap: 4px;">
              <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-main); text-align: left;">Hint Cooldown Delay</div>
              <select id="setting-hint-cooldown" style="background: var(--bg-hover); color: var(--text-main); padding: 2px 6px; border-radius: var(--radius-sm); border: 1px dashed var(--border-subtle); font-size: 0.72rem; height: 24px; cursor: pointer; width: 100%;">
                ${Array.from({ length: 19 }, (_, i) => i + 2).map(sec => `
                  <option value="${sec}" ${settings.hintCooldown === sec || (!settings.hintCooldown && sec === 4) ? "selected" : ""}>${sec} Seconds</option>
                `).join('')}
              </select>
            </div>

            <div style="display: flex; flex: 1; flex-direction: column; gap: 4px; align-items: flex-start;">
              <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-main); white-space: nowrap; text-align: left;">Smart Hint Tokens</div>
              <button class="btn btn-secondary" id="btn-add-tokens" style="width: 100%; height: 24px; font-size: 0.7rem; padding: 0 8px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add 10 Tokens
              </button>
            </div>
          </div>

          <!-- PWA Install -->
          <div id="settings-pwa-install-section" class="settings-row" style="display: ${canInstall ? "flex" : "none"};">
            <div class="settings-label">
              <div>Install App</div>
              <div>Offline play</div>
            </div>
            <button class="btn-circular-install" id="btn-pwa-install-settings" title="Install App">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>

          <!-- Reset Database -->
          <div class="settings-row">
            <div class="settings-label">
              <div style="color: #ef4444 !important;">Reset Database</div>
              <div>Erase all data</div>
            </div>
            <button class="btn btn-sm btn-danger" id="btn-reset-db-settings" style="background: transparent; color: #ef4444; border: none; padding: 0;">Reset</button>
          </div>

          <!-- Merged Visitor Analytics & App Version Info Card -->
          <div class="settings-info-card" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.65rem; padding: 8px !important;">
            <!-- Column 1: Analytics -->
            <div style="display: flex; flex-direction: column; gap: 3px;">
              <div style="font-weight: 700; font-size: 0.7rem; color: var(--text-main); display: flex; align-items: center; gap: 3px; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 2px; margin-bottom: 2px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Analytics
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-muted);">Unique:</span>
                <span id="settings-unique-count" class="count-animated" style="font-weight: 700; color: var(--primary);">...</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-muted);">Visits:</span>
                <span id="settings-total-count" class="count-animated" style="font-weight: 700; color: var(--text-main);">...</span>
              </div>
            </div>
            
            <!-- Column 2: System Info -->
            <div style="display: flex; flex-direction: column; gap: 3px; border-left: 1px dashed var(--border-subtle); padding-left: 8px;">
              <div style="font-weight: 700; font-size: 0.7rem; color: var(--text-main); display: flex; align-items: center; gap: 3px; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 2px; margin-bottom: 2px;">
                System
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Version:</span>
                <span style="font-weight: 600; color: var(--primary);">v${APP_VERSION}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Storage:</span>
                <span id="settings-db-usage" style="font-weight: 500; color: var(--text-main);">Calculating...</span>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: var(--space-2);">
          <button class="btn btn-primary" id="btn-save-settings" style="padding: 4px 12px; height: 28px; font-size: 0.75rem;">Save & Close</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    const pwaInstallSettingsBtn = this.element.querySelector(
      "#btn-pwa-install-settings",
    );
    const resetDbBtn = this.element.querySelector("#btn-reset-db-settings");

    if (pwaInstallSettingsBtn) {
      pwaInstallSettingsBtn.addEventListener("click", async () => {
        if (this.app && this.app.deferredInstallPrompt) {
          this.app.deferredInstallPrompt.prompt();
          this.app.deferredInstallPrompt = null;
          this.updatePwaInstallState(false);
        }
      });
    }

    if (resetDbBtn) {
      resetDbBtn.addEventListener("click", async () => {
        resetDbBtn.disabled = true;
        const confirmReset = window.confirm(
          "Reset all game data? This will clear saved images and stats.",
        );
        if (confirmReset) {
          await ImageStore.clearAllDatabaseData();
          alert("Reset Complete! The app will now reload.");
          window.location.reload();
        }
        resetDbBtn.disabled = false;
      });
    }

    const borderTransparentCheckbox = this.element.querySelector("#setting-border-transparent");
    const borderColorInput = this.element.querySelector("#setting-border-color");
    if (borderTransparentCheckbox && borderColorInput) {
      borderTransparentCheckbox.addEventListener("change", () => {
        borderColorInput.disabled = borderTransparentCheckbox.checked;
      });
    }

    const addTokensBtn = this.element.querySelector("#btn-add-tokens");
    if (addTokensBtn) {
      addTokensBtn.addEventListener("click", () => {
        if (this.app && this.app.activeGame) {
          this.app.activeGame.addHintTokens(10);
          alert("Added 10 Smart Hint tokens to current game!");
        } else {
          alert("Start a puzzle game first to add hint tokens!");
        }
      });
    }

    const close = () => {
      const sound = this.element.querySelector("#setting-sound").checked;
      const snap = this.element.querySelector("#setting-snap").value;
      const assistantToasts = this.element.querySelector("#setting-assistant").checked;
      const borderColor = this.element.querySelector("#setting-border-color").value;
      const borderTransparent = this.element.querySelector("#setting-border-transparent").checked;
      const hintCooldown = parseInt(this.element.querySelector("#setting-hint-cooldown").value, 10);

      SettingsStore.saveSettings({
        sound,
        snapSensitivity: snap,
        assistantToasts,
        borderColor,
        borderTransparent,
        hintCooldown
      });

      if (this.app && this.app.activeGame && this.app.activeGame.renderer) {
        this.app.activeGame.renderer.updatePieceBorders();
      }

      this.hide();
      if (this.onClose) this.onClose();
    };

    // Close modal if clicking outside on the overlay backdrop
    this.element.addEventListener("click", (e) => {
      if (e.target === this.element) {
        close();
      }
    });

    this.element
      .querySelector("#btn-close-settings")
      .addEventListener("click", close);
    this.element
      .querySelector("#btn-save-settings")
      .addEventListener("click", close);
  }

  show() {
    this.element.classList.add("active");

    // Sync input fields with latest settings to prevent reverting to defaults
    const settings = SettingsStore.getSettings();
    
    const soundEl = this.element.querySelector("#setting-sound");
    if (soundEl) soundEl.checked = settings.sound !== false;
    
    const assistantEl = this.element.querySelector("#setting-assistant");
    if (assistantEl) assistantEl.checked = settings.assistantToasts !== false;
    
    const snapEl = this.element.querySelector("#setting-snap");
    if (snapEl) snapEl.value = settings.snapSensitivity || "normal";
    
    const borderTransEl = this.element.querySelector("#setting-border-transparent");
    if (borderTransEl) borderTransEl.checked = settings.borderTransparent === true;
    
    const borderColorEl = this.element.querySelector("#setting-border-color");
    if (borderColorEl) {
      borderColorEl.value = settings.borderColor && settings.borderColor !== 'transparent' ? settings.borderColor : '#64748b';
      borderColorEl.disabled = settings.borderTransparent === true;
    }
    
    const cooldownEl = this.element.querySelector("#setting-hint-cooldown");
    if (cooldownEl) cooldownEl.value = settings.hintCooldown || 4;

    VisitorTracker.recordAndGetStats()
      .then((stats) => {
        const uEl = this.element.querySelector("#settings-unique-count");
        const tEl = this.element.querySelector("#settings-total-count");
        if (uEl)
          VisitorTracker.updateElementWithAnimation(uEl, stats.uniqueFormatted);
        if (tEl)
          VisitorTracker.updateElementWithAnimation(tEl, stats.totalFormatted);
      })
      .catch(() => {});

    this.updateDbUsage();
  }

  async updateDbUsage() {
    const el = this.element.querySelector("#settings-db-usage");
    if (!el) return;

    el.textContent = "Calculating...";

    if (navigator.storage && typeof navigator.storage.estimate === "function") {
      try {
        const { usage, quota } = await navigator.storage.estimate();
        if (typeof usage === "number") {
          const used = this.formatBytes(usage);
          const cap =
            typeof quota === "number" ? this.formatBytes(quota) : null;
          el.textContent = cap ? `${used} / ${cap}` : `${used}`;
          return;
        }
      } catch (err) {
        console.warn("[SettingsView] storage estimate failed", err);
      }
    }

    const fallback = await this.estimateIndexedDbUsage();
    if (fallback) {
      el.textContent = fallback;
    } else {
      el.textContent = "Unavailable";
    }
  }

  async estimateIndexedDbUsage() {
    try {
      const db = await dbManager.open();
      if (!db || !db.objectStoreNames.length) return null;

      let totalBytes = 0;
      const stores = Array.from(db.objectStoreNames);

      for (const storeName of stores) {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const records = await new Promise((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = (e) => reject(e.target.error);
        });

        for (const record of records) {
          for (const value of Object.values(record)) {
            if (value instanceof Blob) {
              totalBytes += value.size;
            } else if (value instanceof ArrayBuffer) {
              totalBytes += value.byteLength;
            } else if (ArrayBuffer.isView(value)) {
              totalBytes += value.byteLength;
            } else if (typeof value === "string") {
              totalBytes += value.length * 2;
            } else if (
              typeof value === "number" ||
              typeof value === "boolean"
            ) {
              totalBytes += 8;
            } else if (value && typeof value === "object") {
              try {
                const serialized = JSON.stringify(value);
                totalBytes += serialized ? serialized.length * 2 : 0;
              } catch (e) {}
            }
          }
        }
      }

      return this.formatBytes(totalBytes);
    } catch (err) {
      console.warn("[SettingsView] fallback IndexedDB usage failed", err);
      return null;
    }
  }

  formatBytes(bytes) {
    if (typeof bytes !== "number" || Number.isNaN(bytes)) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  }

  hide() {
    this.element.classList.remove("active");
  }
}
