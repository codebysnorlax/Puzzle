import { NormalPuzzle } from '../puzzle/normal/NormalPuzzle.js';
import { JigsawPuzzle } from '../puzzle/jigsaw/JigsawPuzzle.js';
import { PuzzleRenderer } from '../renderer/PuzzleRenderer.js';
import { Timer } from '../game/Timer.js';
import { MovementTracker } from '../game/MovementTracker.js';
import { InputHandler } from './Input.js';
import { GameHistory } from '../storage/GameHistory.js';
import { GameStates } from './GameState.js';

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
    console.log('[Game] Starting active puzzle session:', this.config);

    const viewportW = this.container.clientWidth || window.innerWidth;
    const viewportH = this.container.clientHeight || window.innerHeight;

    // 1. Instantiate Puzzle Engine (Normal or Jigsaw)
    const puzzleOptions = {
      imageWidth: this.config.processedImage.width,
      imageHeight: this.config.processedImage.height,
      viewportWidth: viewportW,
      viewportHeight: viewportH,
      difficulty: this.config.difficulty,
      seed: Date.now()
    };

    if (this.config.mode === 'jigsaw') {
      this.puzzle = new JigsawPuzzle(puzzleOptions);
    } else {
      this.puzzle = new NormalPuzzle(puzzleOptions);
    }

    // 2. Generate pieces & seeded shuffle
    this.puzzle.generate();

    // 3. Instantiate PuzzleRenderer & render board target and piece sprites
    this.renderer = new PuzzleRenderer(this.app.pixiApp);
    await this.renderer.renderPuzzle(
      this.puzzle,
      this.config.processedImage.canvas,
      this.config.mode
    );

    // 4. Attach responsive resize callback
    this.app.pixiApp.onResize = (width, height) => {
      this.handleResize(width, height);
    };

    // 5. Instantiate Timer and MovementTracker
    this.timer = new Timer((timeStr) => {
      this.gameView.updateHUD({ timeStr });
    });

    this.movementTracker = new MovementTracker(({ moveCount }) => {
      this.gameView.updateHUD({ moves: moveCount });
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
  }

  handleResize(width, height) {
    if (!this.puzzle || !this.renderer) return;

    this.puzzle.resize(width, height);
    this.renderer.resize(this.puzzle, this.config.processedImage.canvas, this.config.mode);

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
      console.log('[Game] First piece movement detected. Timer started.');
    }
  }

  async handlePuzzleCompletion() {
    const elapsedMs = this.timer.stop();
    const finalTimeStr = this.timer.getFormattedTime();
    const finalMoves = this.movementTracker.moveCount;
    const finalDistance = Math.round(this.movementTracker.totalDistance);

    console.log(`[Game] 🎉 Puzzle Complete! Time: ${finalTimeStr}, Moves: ${finalMoves}, Dist: ${finalDistance}px`);

    this.app.stateMachine.transitionTo(GameStates.SOLVED);

    // Save match result into IndexedDB
    try {
      await GameHistory.saveMatch({
        imageName: 'Puzzle Image',
        mode: this.config.mode,
        difficulty: this.config.difficulty,
        pieceCount: this.puzzle.pieces.length,
        timeMs: elapsedMs,
        moveCount: finalMoves,
        totalDistance: finalDistance,
        seed: String(this.puzzle.seed)
      });
    } catch (e) {
      console.warn('[Game] Failed to save history to IndexedDB:', e);
    }

    // Show completion modal dialog
    this.resultView.showStats({
      timeStr: finalTimeStr,
      moves: finalMoves,
      distanceStr: `${finalDistance.toLocaleString()} px`
    });
  }

  destroy() {
    if (this.app && this.app.pixiApp) {
      this.app.pixiApp.onResize = null;
    }
    if (this.timer) this.timer.stop();
    if (this.inputHandler) this.inputHandler.destroy();
    if (this.renderer) this.renderer.clear();

    this.puzzle = null;
    this.renderer = null;
    this.timer = null;
    this.movementTracker = null;
    this.inputHandler = null;
    this.isStarted = false;
  }
}
