import { NormalPuzzle } from '../puzzle/normal/NormalPuzzle.js';
import { PuzzleRenderer } from '../renderer/PuzzleRenderer.js';
import { Timer } from '../game/Timer.js';
import { MovementTracker } from '../game/MovementTracker.js';
import { calculateSmartRating } from '../game/SmartRating.js';
import { InputHandler } from './Input.js';
import { GameHistory } from '../storage/GameHistory.js';
import { GameStates } from './GameState.js';
import { SoundEffects } from '../game/SoundEffects.js';
import { PuzzleStatusStore } from '../storage/PuzzleStatusStore.js';

/**
 * Game — Game Session Controller orchestrating Puzzle Engine, Pixi Renderer, Timer, and Input
 */
export class Game {
  constructor({
    app,
    config,
    containerElement,
    gameView,
    resultView
  }) {
    this.app = app;
    this.config = config;
    this.container = containerElement;
    this.gameView = gameView;
    this.resultView = resultView;

    this.puzzle = null;
    this.renderer = null;
    this.timer = null;
    this.movementTracker = null;
    this.inputHandler = null;

    this.isStarted = false;
  }

  async start() {
    const viewportW = (this.container && this.container.clientWidth) || window.innerWidth;
    const viewportH = (this.container && this.container.clientHeight) || (window.innerHeight - 48);

    if (!this.config.processedImage || !this.config.processedImage.width) {
      console.error('[Game ERROR] Missing processedImage in config!', this.config);
      throw new Error('[Game] Config is missing processedImage or image dimensions');
    }

    // 1. Instantiate Normal Grid-Swap Puzzle Engine
    const puzzleOptions = {
      imageWidth: this.config.processedImage.width,
      imageHeight: this.config.processedImage.height,
      viewportWidth: viewportW,
      viewportHeight: viewportH,
      difficulty: this.config.difficulty,
      seed: Date.now()
    };

    this.puzzle = new NormalPuzzle(puzzleOptions);

    // 2. Generate pieces & seeded shuffle
    this.puzzle.generate();

    // 3. Instantiate PuzzleRenderer & render board target and piece sprites
    this.renderer = new PuzzleRenderer(this.app.pixiApp);
    
    await this.renderer.renderPuzzle(
      this.puzzle,
      this.config.processedImage.canvas,
      'normal'
    );

    if (this.gameView) {
      setTimeout(() => {
        this.gameView.hidePuzzleSkeleton();
      }, 200);
    }

    // Automatically set adaptive HUD dock position (Top/Bottom if side margin < 65px | Left/Right if side margin >= 65px)
    this.updateDockOrientation();

    // Wire HUD navbar Peek Hint button handler
    if (this.gameView) {
      this.gameView.onPeekHint = () => this.handlePeekHint();
    }

    // 4. Attach responsive resize callback
    this.app.pixiApp.onResize = (width, height) => {
      this.handleResize(width, height);
    };

    // 5. Instantiate Timer and MovementTracker
    this.timer = new Timer((timeStr) => {
      this.gameView.updateHUD({ timeStr });
    });

    this.movementTracker = new MovementTracker(({ moveCount, totalDistance }) => {
      const currentRating = calculateSmartRating({
        moveCount,
        totalDistance,
        timeSeconds: this.timer ? this.timer.getElapsedSeconds() : 0,
        totalPieces: this.puzzle ? this.puzzle.pieces.length : 16
      });

      this.gameView.updateHUD({
        moves: moveCount,
        rating: currentRating
      });
    });

    // 6. Instantiate Input Handler
    this.inputHandler = new InputHandler({
      puzzle: this.puzzle,
      puzzleRenderer: this.renderer,
      timer: this.timer,
      movementTracker: this.movementTracker,
      onFirstMovement: () => this.handleFirstMovement(),
      onPuzzleComplete: () => this.handlePuzzleCompletion()
    });

    this.isStarted = true;

    // Track started status (1 Blue Tick, 1 Gray Tick)
    if (this.config && this.config.imageId) {
      PuzzleStatusStore.markStarted(this.config.imageId);
    }
  }

  updateDockOrientation() {
    if (!this.gameView) return;

    const viewportW = (this.container && this.container.clientWidth) || window.innerWidth;
    const viewportH = (this.container && this.container.clientHeight) || window.innerHeight;

    // On mobile devices or short viewports (<= 768px width OR <= 600px height), ALWAYS position docks at Top & Bottom
    if (viewportW <= 768 || viewportH <= 600) {
      this.gameView.setDockOrientation(true);
      return;
    }

    if (this.puzzle && this.puzzle.boardLayout) {
      const board = this.puzzle.boardLayout;
      const sideSpace = (viewportW - board.width) / 2;
      const verticalSpace = (viewportH - board.height) / 2;

      const isTopBottom = sideSpace < 65 || (verticalSpace >= 50 && verticalSpace > sideSpace);
      this.gameView.setDockOrientation(isTopBottom);
    } else {
      const isTopBottom = viewportW <= 768 || viewportW < viewportH;
      this.gameView.setDockOrientation(isTopBottom);
    }
  }

  handlePeekHint() {
    if (!this.renderer || !this.config || !this.config.processedImage || !this.puzzle) return;
    this.renderer.showTemporaryHint(
      this.config.processedImage.canvas,
      this.puzzle.boardLayout,
      2200
    );
  }

  handleResize(width, height) {
    if (!this.puzzle || !this.renderer) return;

    const viewportH = (this.container && this.container.clientHeight) || (height - 48);
    this.puzzle.resize(width, viewportH);
    this.renderer.resize(this.puzzle, this.config.processedImage.canvas, 'normal');

    this.updateDockOrientation();

    // Re-bind input events to new sprites
    if (this.inputHandler) {
      this.inputHandler.destroy();
      this.inputHandler = new InputHandler({
        puzzle: this.puzzle,
        puzzleRenderer: this.renderer,
        timer: this.timer,
        movementTracker: this.movementTracker,
        onFirstMovement: () => this.handleFirstMovement(),
        onPuzzleComplete: () => this.handlePuzzleCompletion()
      });
    }
  }

  handleFirstMovement() {
    if (this.app.stateMachine.state === GameStates.READY) {
      this.app.stateMachine.transitionTo(GameStates.RUNNING);
      this.timer.start();
    }
  }

  async handlePuzzleCompletion() {
    const elapsedMs = this.timer.stop();
    const finalTimeStr = this.timer.getFormattedTime();
    const finalMoves = this.movementTracker.moveCount;
    const finalDistance = Math.round(this.movementTracker.totalDistance);

    const finalRating = calculateSmartRating({
      moveCount: finalMoves,
      totalDistance: finalDistance,
      timeSeconds: Math.round(elapsedMs / 1000),
      totalPieces: this.puzzle.pieces.length
    });

    this.app.stateMachine.transitionTo(GameStates.SOLVED);

    // Track completed status (Green Border)
    if (this.config && this.config.imageId) {
      PuzzleStatusStore.markCompleted(this.config.imageId);
    }

    // Play win sound effect
    SoundEffects.playWinSound();

    // 1. Play victory glowing animated border on Pixi canvas
    if (this.renderer) {
      this.renderer.playCompletionAnimation(this.puzzle.boardLayout);
    }

    // 2. Show non-blocking status feedback in HUD and floating bar
    if (this.gameView) {
      this.gameView.showCompletionState({ rating: finalRating });
    }

    // 3. Save match result into IndexedDB
    try {
      await GameHistory.saveMatch({
        imageName: 'Puzzle Image',
        mode: 'normal',
        difficulty: this.config.difficulty,
        pieceCount: this.puzzle.pieces.length,
        timeMs: elapsedMs,
        moveCount: finalMoves,
        totalDistance: finalDistance,
        rating: finalRating,
        seed: String(this.puzzle.seed)
      });
    } catch (e) {
      console.warn('[Game] Failed to save history to IndexedDB:', e);
    }
  }

  onThemeChange(theme) {
    if (this.app && this.app.pixiApp) {
      this.app.pixiApp.updateTheme(theme);
    }
    if (this.renderer && this.puzzle) {
      this.renderer.updateTheme(theme, this.puzzle);
    }
  }

  destroy() {
    if (this.app && this.app.stateMachine && this.app.stateMachine.state !== GameStates.SOLVED) {
      if (this.config && this.config.imageId) {
        PuzzleStatusStore.markQuit(this.config.imageId);
      }
    }

    if (this.app && this.app.pixiApp) {
      this.app.pixiApp.onResize = null;
    }
    if (this.timer) this.timer.stop();
    if (this.inputHandler) this.inputHandler.destroy();
    if (this.renderer) this.renderer.clear();
    if (this.gameView) this.gameView.hideCompletionState();

    this.puzzle = null;
    this.renderer = null;
    this.timer = null;
    this.movementTracker = null;
    this.inputHandler = null;
    this.isStarted = false;
  }
}
