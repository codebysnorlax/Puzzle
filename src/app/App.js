import { GameStates, GameStateMachine } from "./GameState.js";
import { HomeView } from "../ui/HomeView.js";
import { GameView } from "../ui/GameView.js";
import { ResultView } from "../ui/ResultView.js";
import { SettingsView } from "../ui/SettingsView.js";
import { PixiApp } from "../renderer/PixiApp.js";
import { ImageProcessor } from "../image/ImageProcessor.js";
import { Game } from "./Game.js";
import { SettingsStore } from "../storage/SettingsStore.js";

export class App {
  constructor(rootContainer) {
    this.container = rootContainer;
    this.stateMachine = new GameStateMachine(GameStates.IDLE);
    this.pixiApp = new PixiApp();
    this.activeGame = null;
    this.deferredInstallPrompt = null;
    this.swRegistration = null;

    // Apply stored Light/Dark theme on boot
    SettingsStore.applyTheme();

    this.activeConfig = {
      imageUrl: null,
      mode: "normal",
      difficulty: "normal",
      processedImage: null,
    };

    this.initViews();
    this.initPwaEvents();

    // Confirm reload if game is in progress
    window.addEventListener("beforeunload", (e) => {
      const isGameActive = [GameStates.READY, GameStates.RUNNING, GameStates.PAUSED].includes(
        this.stateMachine.state
      );
      if (isGameActive) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }

  initPwaEvents() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (this.homeView && this.homeView.updatePwaInstallState) {
        this.homeView.updatePwaInstallState(true);
      }
      if (this.settingsView && this.settingsView.updatePwaInstallState) {
        this.settingsView.updatePwaInstallState(true);
      }
    });

    window.addEventListener("appinstalled", () => {
      this.deferredInstallPrompt = null;
      console.log("[App] PWA installed successfully");
      if (this.homeView && this.homeView.updatePwaInstallState) {
        this.homeView.updatePwaInstallState(false);
      }
    });
  }

  handleServiceWorkerRegistration(reg) {
    this.swRegistration = reg;
  }

  async promptPwaInstall() {
    if (!this.deferredInstallPrompt) {
      console.warn("[App] promptPwaInstall called but no deferredInstallPrompt is available");
      return false;
    }
    this.deferredInstallPrompt.prompt();
    const { outcome } = await this.deferredInstallPrompt.userChoice;
    console.log("[App] PWA install choice:", outcome);
    this.deferredInstallPrompt = null;
    if (this.homeView && this.homeView.updatePwaInstallState) {
      this.homeView.updatePwaInstallState(false);
    }
    return outcome === "accepted";
  }

  showUpdateBanner() {
    let banner = document.getElementById("pwa-update-banner");
    if (banner) return;

    banner = document.createElement("div");
    banner.id = "pwa-update-banner";
    banner.className = "surface-card";
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--primary);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      color: var(--text-main);
      font-size: 0.88rem;
    `;

    banner.innerHTML = `
      <span>A new app version is ready!</span>
      <button class="btn btn-primary" id="btn-update-reload" style="padding: 4px 12px; min-height: 32px; font-size: 0.8rem;">Update Now</button>
      <button class="btn btn-icon" id="btn-update-dismiss" style="min-height: 32px; width: 32px;" title="Dismiss">&times;</button>
    `;

    document.body.appendChild(banner);

    banner.querySelector("#btn-update-reload").addEventListener("click", () => {
      if (this.swRegistration && this.swRegistration.waiting) {
        this.swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      window.location.reload();
    });

    banner
      .querySelector("#btn-update-dismiss")
      .addEventListener("click", () => {
        banner.remove();
      });
  }

  initViews() {
    // 1. Home View
    this.homeView = new HomeView(
      this.container,
      (config) => this.startGame(config),
      this,
    );

    // 2. Game View
    this.gameView = new GameView(
      this.container,
      {
        onBackToHome: () => this.showHome(),
        onOpenSettings: () => this.settingsView.show(),
        onRestartGame: () => this.restartGame(),
      },
      this,
    );

    // 3. Result View Modal
    this.resultView = new ResultView(this.container, {
      onPlayAgain: () => this.restartGame(),
      onChooseImage: () => this.showHome(),
    });

    // 4. Settings View Modal
    this.settingsView = new SettingsView(this.container, null, this);
  }

  async startGame(config) {
    this.activeConfig = { ...config };

    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }

    try {
      let processed;
      const targetImg = this.activeConfig.imageUrl || "./images/demo.webp";

      try {
        processed = await ImageProcessor.processImage(targetImg);
      } catch (imgErr) {
        console.error(
          "[App] Primary ImageProcessor failed, attempting fallback to demo image:",
          imgErr,
        );
        processed = await ImageProcessor.processImage("./images/demo.webp");
      }

      this.activeConfig.processedImage = processed;

      // Update HUD display
      this.gameView.updateHUD({
        mode: this.activeConfig.mode,
        difficulty: this.activeConfig.difficulty,
        timeStr: "00:00",
        moves: 0,
        imageUrl: this.activeConfig.imageUrl,
        imageId: this.activeConfig.imageId,
      });

      // View switch: Home -> Game
      this.homeView.hide();
      this.gameView.show();

      // Initialize Pixi canvas inside container
      const container = this.gameView.getCanvasContainer();
      await this.pixiApp.init(container);

      // Transition state: IDLE -> READY
      this.stateMachine.transitionTo(GameStates.READY);

      // Launch Game Session
      this.activeGame = new Game({
        app: this,
        config: this.activeConfig,
        containerElement: container,
        gameView: this.gameView,
        resultView: this.resultView,
      });

      await this.activeGame.start();
    } catch (err) {
      console.error("[App] Critical failure during startGame pipeline:", err);
      this.stateMachine.transitionTo(GameStates.ERROR);
      this.showHome();
    }
  }

  async restartGame() {
    const isGameActive = [GameStates.READY, GameStates.RUNNING, GameStates.PAUSED].includes(
      this.stateMachine.state
    );
    if (isGameActive) {
      const confirmRestart = window.confirm("Are you sure you want to restart the puzzle? All current progress will be lost.");
      if (!confirmRestart) {
        return;
      }
    }

    if (this.gameView) {
      this.gameView.showPuzzleSkeleton();
    }
    if (this.activeConfig && this.activeConfig.imageUrl) {
      await this.startGame(this.activeConfig);
    } else {
      this.showHome();
    }
  }

  onThemeChange(theme) {
    if (this.pixiApp) {
      this.pixiApp.updateTheme(theme);
    }
    if (this.activeGame) {
      this.activeGame.onThemeChange(theme);
    }
    if (
      this.homeView &&
      typeof this.homeView.updateThemeButton === "function"
    ) {
      this.homeView.updateThemeButton(theme);
    }
    if (
      this.gameView &&
      typeof this.gameView.updateThemeButton === "function"
    ) {
      this.gameView.updateThemeButton(theme);
    }
    if (
      this.settingsView &&
      typeof this.settingsView.refreshThemeSelection === "function"
    ) {
      this.settingsView.refreshThemeSelection();
    }
  }

  async hardRefreshApp() {
    console.log(
      "[App] Hard Refresh triggered: purging app shell caches and unregistering SW while keeping user images intact...",
    );
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          await caches.delete(key);
        }
      }
    } catch (err) {
      console.warn("[App] Non-fatal error during Hard Refresh:", err);
    }
    window.location.reload();
  }

  showHome() {
    this.stateMachine.transitionTo(GameStates.IDLE);
    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }
    if (this.pixiApp && this.pixiApp.app && this.pixiApp.app.stage) {
      this.pixiApp.app.stage.removeChildren();
    }
    this.gameView.hide();
    this.homeView.show();
  }
}
