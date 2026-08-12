import { SettingsStore } from "../storage/SettingsStore.js";
import { SoundEffects } from "../game/SoundEffects.js";

/**
 * GameView — Active gameplay container with Dynamic Adaptive HUD Docks
 * (Landscape -> Top & Bottom horizontal docks | Portrait/Square -> Left & Right vertical docks)
 */
export class GameView {
  constructor(
    container,
    { onBackToHome, onOpenSettings, onRestartGame, onPeekHint, onUndo, onRedo },
    app = null,
  ) {
    this.container = container;
    this.onBackToHome = onBackToHome;
    this.onOpenSettings = onOpenSettings;
    this.onRestartGame = onRestartGame;
    this.onPeekHint = onPeekHint;
    this.onUndo = onUndo;
    this.onRedo = onRedo;
    this.app = app;

    this.isLandscape = false;
    this.render();
  }

  render() {
    const currentTheme = SettingsStore.getSettings().theme || "light";

    this.element = document.createElement("div");
    this.element.className = "view game-view hud-dock-layout-portrait";

    this.element.innerHTML = `
      <div id="mobile-hud-bar">
        <!-- Control Dock (Left in Portrait | Left in Mobile Top Bar) -->
        <div class="hud-dock hud-dock-control" id="hud-dock-control">
          <!-- Back to Gallery Button -->
          <button class="hud-v-btn brand-accent" id="hud-btn-back" title="Back to Gallery">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div class="hud-v-divider"></div>

          <!-- Peek Reference Hint -->
          <button class="hud-v-btn" id="hud-btn-hint" title="Peek Reference Hint">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>

          <!-- Theme Toggle -->
          <button class="hud-v-btn" id="hud-theme-toggle-single" title="Toggle Theme">
            ${
              currentTheme === "dark"
                ? `
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            `
                : `
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            `
            }
          </button>

          <!-- Restart Puzzle -->
          <button class="hud-v-btn" id="hud-btn-restart" title="Restart Puzzle">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </button>

          <!-- Settings -->
          <button class="hud-v-btn" id="hud-btn-settings" title="Settings">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>

        <!-- Tracker Dock (Right in Portrait | Right in Mobile Top Bar) -->
        <div class="hud-dock hud-dock-tracker" id="hud-dock-tracker">
          <!-- Timer -->
          <div class="hud-v-stat" title="Timer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span id="hud-timer">00:00</span>
          </div>

          <div class="hud-v-divider"></div>

          <!-- Moves -->
          <div class="hud-v-stat" title="Moves">
            <span id="hud-moves">0m</span>
          </div>

          <div class="hud-v-divider"></div>

          <!-- Rating -->
          <div class="hud-v-stat" title="Rating">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span id="hud-rating">100</span>
          </div>
        </div>
      </div>

      <!-- Undo / Redo buttons placed just above the puzzle -->
      <div class="hud-undo-redo-bar" id="hud-undo-redo-bar">
        <button class="hud-v-btn" id="hud-btn-undo" title="Undo Swap" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </button>
        <button class="hud-v-btn" id="hud-btn-redo" title="Redo Swap" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </button>
      </div>

      <!-- Pixi Canvas Target Viewport -->
      <div id="puzzle-canvas-container" style="position: relative;">
        <!-- Soft Moving Gradient Shimmer Skeleton for Canvas Area -->
        <div class="puzzle-area-skeleton" id="puzzle-area-skeleton"></div>

        <!-- Non-Blocking Solved Action Bar is now handled dynamically as a premium toast notification -->
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  setDockOrientation(isLandscape) {
    this.isLandscape = isLandscape;
    if (!this.element) return;

    if (isLandscape) {
      this.element.classList.remove("hud-dock-layout-portrait");
      this.element.classList.add("hud-dock-layout-landscape");
    } else {
      this.element.classList.remove("hud-dock-layout-landscape");
      this.element.classList.add("hud-dock-layout-portrait");
    }
  }

  bindEvents() {
    const singleThemeBtn = this.element.querySelector(
      "#hud-theme-toggle-single",
    );

    if (singleThemeBtn) {
      singleThemeBtn.addEventListener("click", () => {
        const current = SettingsStore.getSettings().theme || "light";
        const nextTheme = current === "dark" ? "light" : "dark";

        SettingsStore.saveSettings({ theme: nextTheme });
        SettingsStore.applyTheme(nextTheme);

        if (this.app) {
          this.app.onThemeChange(nextTheme);
        }

        singleThemeBtn.innerHTML =
          nextTheme === "dark"
            ? `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        `
            : `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        `;
      });
    }

    const undoBtn = this.element.querySelector("#hud-btn-undo");
    if (undoBtn) {
      undoBtn.addEventListener("click", () => {
        if (this.onUndo) this.onUndo();
      });
    }

    const redoBtn = this.element.querySelector("#hud-btn-redo");
    if (redoBtn) {
      redoBtn.addEventListener("click", () => {
        if (this.onRedo) this.onRedo();
      });
    }

    this.element
      .querySelector("#hud-btn-back")
      .addEventListener("click", () => {
        if (this.onBackToHome) this.onBackToHome();
      });

    const hintBtn = this.element.querySelector("#hud-btn-hint");
    if (hintBtn) {
      hintBtn.addEventListener("click", () => {
        if (this.onPeekHint) this.onPeekHint();
      });
    }

    this.element
      .querySelector("#hud-btn-restart")
      .addEventListener("click", () => {
        this.hideCompletionState();
        if (this.onRestartGame) this.onRestartGame();
      });

    this.element
      .querySelector("#hud-btn-settings")
      .addEventListener("click", () => {
        if (this.onOpenSettings) this.onOpenSettings();
      });

  }

  updateHUD({ mode, difficulty, timeStr, moves, rating }) {
    if (!this.element) return;

    if (mode && difficulty) {
      const badge = this.element.querySelector("#hud-mode-badge");
      if (badge) {
        badge.textContent = mode.toLowerCase();
      }
    }
    if (timeStr !== undefined) {
      const timer = this.element.querySelector("#hud-timer");
      if (timer) timer.textContent = timeStr;
    }
    if (moves !== undefined) {
      const movesEl = this.element.querySelector("#hud-moves");
      if (movesEl) movesEl.textContent = `${moves}m`;
    }
    if (rating !== undefined) {
      const ratingEl = this.element.querySelector("#hud-rating");
      if (ratingEl) ratingEl.textContent = `${rating}`;
    }
  }

  updateUndoRedo(canUndo, canRedo) {
    const undoBtn = this.element.querySelector("#hud-btn-undo");
    const redoBtn = this.element.querySelector("#hud-btn-redo");
    if (undoBtn) undoBtn.disabled = !canUndo;
    if (redoBtn) redoBtn.disabled = !canRedo;
  }

  showCompletionState({ rating = 100 }) {
    if (!this.element) return;

    const badge = this.element.querySelector("#hud-mode-badge");
    if (badge) {
      badge.textContent = `✓${rating}`;
      badge.style.background = "var(--success)";
      badge.style.color = "#ffffff";
    }

    if (this.solvedToast) {
      this.dismissToast(this.solvedToast);
    }

    // Victory toast notification replaces the old solved floating bar
    this.solvedToast = this.showToast({
      title: "Puzzle Solved!",
      description: `Performance score: ${rating}/100. Great job completing the challenge!`,
      type: "success",
      autoDismiss: false,
      actions: [
        {
          label: "Play Again",
          id: "solved-btn-restart-toast",
          primary: true,
          onClick: () => {
            if (this.onRestartGame) this.onRestartGame();
          }
        },
        {
          label: "Gallery",
          id: "solved-btn-home-toast",
          primary: false,
          onClick: () => {
            if (this.onBackToHome) this.onBackToHome();
          }
        }
      ]
    });
  }

  hideCompletionState() {
    if (!this.element) return;

    const badge = this.element.querySelector("#hud-mode-badge");
    if (badge) {
      badge.style.background = "";
      badge.style.color = "";
    }

    if (this.solvedToast) {
      this.dismissToast(this.solvedToast);
      this.solvedToast = null;
    }
  }

  /**
   * Get or dynamically instantiate the toast container element in the DOM
   */
  static getOrCreateContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Display a premium, high-end SaaS toast notification
   */
  showToast(messageOrObj) {
    let title = "Assistant";
    let description = "";
    let type = "info";
    let autoDismiss = true;
    let actions = null;

    if (typeof messageOrObj === "string") {
      description = messageOrObj;
      if (messageOrObj.includes("Only 2") || messageOrObj.includes("Just 2")) {
        title = "Hint";
        type = "warning";
      } else if (messageOrObj.includes("grandma") || messageOrObj.includes("asleep") || messageOrObj.includes("stuck") || messageOrObj.includes("staring")) {
        title = "Assistant";
        type = "info";
      }
    } else if (messageOrObj && typeof messageOrObj === "object") {
      title = messageOrObj.title || "Notification";
      description = messageOrObj.description || messageOrObj.message || "";
      type = messageOrObj.type || "info";
      autoDismiss = messageOrObj.autoDismiss !== false;
      actions = messageOrObj.actions || null;
    }

    // Play showTost.wav sound
    SoundEffects.playToastSound();

    const toast = document.createElement("div");
    toast.className = `premium-toast toast-type-${type}`;
    toast.setAttribute("role", "alert");

    // Minimal outline SVG Icons based on type
    let iconHtml = "";
    if (type === "success") {
      iconHtml = `<svg class="toast-type-icon stroke-success" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === "warning") {
      iconHtml = `<svg class="toast-type-icon stroke-warning" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else if (type === "error") {
      iconHtml = `<svg class="toast-type-icon stroke-danger" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else {
      // info
      iconHtml = `<svg class="toast-type-icon stroke-info" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
    }

    let actionsHtml = "";
    if (actions && actions.length > 0) {
      actionsHtml = `
        <div class="toast-actions">
          ${actions.map(act => `
            <button class="toast-action-btn ${act.primary ? 'primary' : 'secondary'}" id="${act.id}">
              ${act.label}
            </button>
          `).join('')}
        </div>
      `;
    }

    toast.innerHTML = `
      <div class="toast-layout-left">
        ${iconHtml}
      </div>
      <div class="toast-layout-center">
        <div class="toast-title">${title}</div>
        ${description ? `<div class="toast-description">${description}</div>` : ""}
        ${actionsHtml}
      </div>
      <div class="toast-layout-right">
        <button class="toast-dismiss-btn" aria-label="Dismiss">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;

    // Append to container
    const container = GameView.getOrCreateContainer();
    container.appendChild(toast);

    // Bind action callbacks
    if (actions && actions.length > 0) {
      actions.forEach(act => {
        const btn = toast.querySelector(`#${act.id}`);
        if (btn && act.onClick) {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            act.onClick();
            this.dismissToast(toast);
          });
        }
      });
    }

    // Bind close button
    const dismissBtn = toast.querySelector(".toast-dismiss-btn");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.dismissToast(toast);
      });
    }

    // Trigger slide/fade-in
    requestAnimationFrame(() => {
      toast.classList.add("visible");
    });

    // Auto dismiss after 4 seconds
    if (autoDismiss) {
      setTimeout(() => {
        this.dismissToast(toast);
      }, 4000);
    }

    return toast;
  }

  /**
   * Fade/slide out and remove a toast element smoothly
   */
  dismissToast(toastElement) {
    if (!toastElement || !toastElement.parentNode) return;
    toastElement.classList.remove("visible");

    const removeTimeout = setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.remove();
      }
    }, 400);

    toastElement.addEventListener("transitionend", () => {
      clearTimeout(removeTimeout);
      if (toastElement.parentNode) {
        toastElement.remove();
      }
    }, { once: true });
  }

  showPuzzleSkeleton() {
    if (!this.element) return;
    const skeleton = this.element.querySelector("#puzzle-area-skeleton");
    if (skeleton) skeleton.classList.remove("loaded");
  }

  hidePuzzleSkeleton() {
    if (!this.element) return;
    const skeleton = this.element.querySelector("#puzzle-area-skeleton");
    if (skeleton) skeleton.classList.add("loaded");
  }

  getCanvasContainer() {
    return this.element.querySelector("#puzzle-canvas-container");
  }

  show() {
    this.showPuzzleSkeleton();
    this.element.classList.add("active");
    this.updateThemeButton(SettingsStore.getSettings().theme || "light");
  }

  hide() {
    this.element.classList.remove("active");
  }

  updateThemeButton(theme) {
    const singleThemeBtn = this.element.querySelector(
      "#hud-theme-toggle-single",
    );
    if (!singleThemeBtn) return;
    singleThemeBtn.innerHTML =
      theme === "dark"
        ? `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    `
        : `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    `;
  }
}
