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
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        <div class="settings-header">
          <div>
            <h2 class="settings-title">Settings</h2>
            <p class="settings-subtitle">Tune your puzzle experience</p>
          </div>
          <button class="settings-close-btn" id="btn-close-settings" type="button" aria-label="Close settings" title="Close Settings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="settings-body">
          <div class="settings-row">
            <label class="settings-label" for="setting-sound">
              <div>Sound Effects</div>
              <div>Tile snap & completion audio</div>
            </label>
            <input class="settings-checkbox" type="checkbox" id="setting-sound" ${settings.sound ? "checked" : ""} />
          </div>

          <div class="settings-row">
            <label class="settings-label" for="setting-assistant">
              <div>Game Assistant</div>
              <div>Roasts, tips & idle warnings</div>
            </label>
            <input class="settings-checkbox" type="checkbox" id="setting-assistant" ${settings.assistantToasts !== false ? "checked" : ""} />
          </div>

          <div class="settings-control-grid">
            <label class="settings-field" for="setting-snap">
              <span>Snap Sensitivity</span>
              <select id="setting-snap">
                <option value="very-strict" ${settings.snapSensitivity === "very-strict" ? "selected" : ""}>Very Strict</option>
                <option value="strict" ${settings.snapSensitivity === "strict" ? "selected" : ""}>Strict</option>
                <option value="normal" ${settings.snapSensitivity === "normal" ? "selected" : ""}>Normal</option>
                <option value="relaxed" ${settings.snapSensitivity === "relaxed" ? "selected" : ""}>Relaxed</option>
                <option value="very-relaxed" ${settings.snapSensitivity === "very-relaxed" ? "selected" : ""}>Very Relaxed</option>
              </select>
            </label>

            <div class="settings-field">
              <span>Border Color</span>
              <div class="settings-color-control">
                <input type="color" id="setting-border-color" aria-label="Piece border color" value="${settings.borderColor && settings.borderColor !== 'transparent' ? settings.borderColor : '#64748b'}" />
                <label class="settings-inline-check" for="setting-border-transparent">
                  <input type="checkbox" id="setting-border-transparent" ${settings.borderTransparent ? "checked" : ""} />
                  Transparent
                </label>
              </div>
            </div>
          </div>

          <div class="settings-control-grid settings-control-grid-last">
            <label class="settings-field" for="setting-hint-cooldown">
              <span>Hint Cooldown</span>
              <select id="setting-hint-cooldown">
                ${Array.from({ length: 19 }, (_, i) => i + 2).map(sec => `
                  <option value="${sec}" ${settings.hintCooldown === sec || (!settings.hintCooldown && sec === 4) ? "selected" : ""}>${sec} Seconds</option>
                `).join('')}
              </select>
            </label>

            <div class="settings-field settings-token-field">
              <span>Smart Hint Tokens</span>
              <button class="btn btn-secondary settings-token-button" id="btn-add-tokens" type="button">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add 10 Tokens
              </button>
            </div>
          </div>

          <div id="settings-pwa-install-section" class="settings-row" style="display: ${canInstall ? "flex" : "none"};">
            <div class="settings-label">
              <div>Install App</div>
              <div>Offline play</div>
            </div>
            <button class="btn-circular-install" id="btn-pwa-install-settings" type="button" aria-label="Install app" title="Install App">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>

          <div class="settings-row settings-row-danger">
            <div class="settings-label">
              <div style="color: #ef4444 !important;">Reset Database</div>
              <div>Erase all data</div>
            </div>
            <button class="btn btn-sm btn-danger settings-reset-button" id="btn-reset-db-settings" type="button">Reset</button>
          </div>

          <div class="settings-info-card">
            <div class="settings-info-section">
              <div class="settings-info-heading">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Analytics
              </div>
              <div class="settings-info-line">
                <span>Unique:</span>
                <strong id="settings-unique-count" class="count-animated">...</strong>
              </div>
              <div class="settings-info-line">
                <span>Visits:</span>
                <strong id="settings-total-count" class="count-animated">...</strong>
              </div>
            </div>
            
            <div class="settings-info-section settings-info-system">
              <div class="settings-info-heading">
                System
              </div>
              <div class="settings-info-line">
                <span>Version:</span>
                <strong>v${APP_VERSION}</strong>
              </div>
              <div class="settings-info-line">
                <span>Storage:</span>
                <strong id="settings-db-usage">Calculating...</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-footer">
          <button class="btn btn-primary settings-save-button" id="btn-save-settings" type="button">Save changes</button>
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
      borderColorInput.addEventListener("input", () => {
        // Choosing a color means the user wants a visible border again.
        borderTransparentCheckbox.checked = false;
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
      borderColorEl.disabled = false;
    }
    
    const cooldownEl = this.element.querySelector("#setting-hint-cooldown");
    if (cooldownEl) cooldownEl.value = settings.hintCooldown || 4;

    const visitorStats = VisitorTracker.getCachedStats();
    const uniqueEl = this.element.querySelector("#settings-unique-count");
    const totalEl = this.element.querySelector("#settings-total-count");
    if (uniqueEl) {
      VisitorTracker.updateElementWithAnimation(
        uniqueEl,
        visitorStats.uniqueFormatted,
      );
    }
    if (totalEl) {
      VisitorTracker.updateElementWithAnimation(
        totalEl,
        visitorStats.totalFormatted,
      );
    }

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
