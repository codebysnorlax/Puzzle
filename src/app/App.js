import { GameStates, GameStateMachine } from './GameState.js';
import { HomeView } from '../ui/HomeView.js';
import { GameView } from '../ui/GameView.js';
import { ResultView } from '../ui/ResultView.js';
import { SettingsView } from '../ui/SettingsView.js';
import { PixiApp } from '../renderer/PixiApp.js';
import { ImageProcessor } from '../image/ImageProcessor.js';
import { Game } from './Game.js';
import { SettingsStore } from '../storage/SettingsStore.js';

export class App {
  constructor(rootContainer) {
    this.container = rootContainer;
    this.stateMachine = new GameStateMachine(GameStates.IDLE);
    this.pixiApp = new PixiApp();
    this.activeGame = null;
    
    // Apply stored Light/Dark theme on boot
    SettingsStore.applyTheme();

    this.activeConfig = {
      imageUrl: null,
      mode: 'normal',
      difficulty: 'normal',
      processedImage: null
    };

    this.initViews();
    this.bindStateEvents();
  }

  initViews() {
    // 1. Home View
    this.homeView = new HomeView(this.container, (config) => this.startGame(config));

    // 2. Game View
    this.gameView = new GameView(
      this.container,
      () => this.showHome(),
      () => this.settingsView.show()
    );

    // 3. Result View Modal
    this.resultView = new ResultView(this.container, {
      onPlayAgain: () => this.restartGame(),
      onChooseImage: () => this.showHome()
    });

    // 4. Settings View Modal
    this.settingsView = new SettingsView(this.container);
  }

  bindStateEvents() {
    this.stateMachine.onChange((newState, oldState) => {
      console.log(`[App] State changed from ${oldState} to ${newState}`);
    });
  }

  async startGame(config) {
    this.activeConfig = { ...config };
    console.log('[App] Starting game with config:', this.activeConfig);

    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }

    try {
      // Process image through pipeline (resizing / decoding)
      const processed = await ImageProcessor.processImage(this.activeConfig.imageUrl);
      this.activeConfig.processedImage = processed;

      // Update HUD display
      this.gameView.updateHUD({
        mode: this.activeConfig.mode,
        difficulty: this.activeConfig.difficulty,
        timeStr: '00:00',
        moves: 0,
        imageUrl: this.activeConfig.imageUrl
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
        resultView: this.resultView
      });

      await this.activeGame.start();
    } catch (err) {
      console.error('[App] Failed to load image or start game:', err);
      this.stateMachine.transitionTo(GameStates.ERROR);
      alert('Failed to start puzzle. Please select another image.');
    }
  }

  restartGame() {
    if (this.activeConfig.imageUrl) {
      this.startGame(this.activeConfig);
    } else {
      this.showHome();
    }
  }

  showHome() {
    this.stateMachine.transitionTo(GameStates.IDLE);
    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }
    this.pixiApp.destroy();
    this.gameView.hide();
    this.homeView.show();
  }

  // Developer debug hook for demonstrating completion dialog in Phase 1
  triggerMockCompletion() {
    this.stateMachine.transitionTo(GameStates.SOLVED);
    this.resultView.showStats({
      timeStr: '01:42',
      moves: 18,
      distanceStr: '1,240 px'
    });
  }
}
