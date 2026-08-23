import { NormalPuzzle } from '../puzzle/NormalPuzzle.js';
import { PuzzleRenderer } from '../renderer/PuzzleRenderer.js';
import { Timer } from '../game/Timer.js';
import { MovementTracker } from '../game/MovementTracker.js';
import { calculateSmartRating } from '../game/SmartRating.js';
import { InputHandler } from './Input.js';
import { GameHistory } from '../storage/GameHistory.js';
import { GameStates } from './GameState.js';
import { SoundEffects } from '../game/SoundEffects.js';
import { PuzzleStatusStore } from '../storage/PuzzleStatusStore.js';
import { PieceAnimations } from '../animation/PieceAnimations.js';
import { PuzzleValidator } from '../puzzle/PuzzleValidator.js';
import { SettingsStore } from '../storage/SettingsStore.js';

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
    this.undoStack = [];
    this.redoStack = [];

    // Inactivity / Game Assistant variables
    this.lastActivityTime = 0;
    this.lastToastTime = 0;
    this.inactivityStreak = 0;
    this.inactivityInterval = null;
    this.pendingToastTimeout = null;
    this.shownMessageHistory = [];
    this.resetActivityListener = () => {
      this.lastActivityTime = Date.now();
      this.inactivityStreak = 0;
      if (this.pendingToastTimeout) {
        clearTimeout(this.pendingToastTimeout);
        this.pendingToastTimeout = null;
      }
    };
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

    this.undoStack = [];
    this.redoStack = [];
    this.hintsRemaining = 5;

    // Automatically set adaptive HUD dock position (Top/Bottom if side margin < 65px | Left/Right if side margin >= 65px)
    this.updateDockOrientation();

    // Wire HUD navbar Peek Hint button handler
    if (this.gameView) {
      this.gameView.onPeekHint = () => this.handlePeekHint();
      this.gameView.onSmartHint = () => this.handleSmartHint();
      this.gameView.updateSmartHintCount(this.hintsRemaining);
      this.gameView.onUndo = () => this.undo();
      this.gameView.onRedo = () => this.redo();
      this.gameView.updateUndoRedo(false, false);
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
      const currentRating = this._calculateCurrentRating();
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
      onPuzzleComplete: () => this.handlePuzzleCompletion(),
      onSwap: (pieceA, pieceB, gridA, gridB) => this.recordSwap(pieceA, pieceB, gridA, gridB),
      onNearMiss: () => this.handleNearMiss()
    });

    this.isStarted = true;
    this.showWelcomeToast();

    // Track started status (1 Blue Tick, 1 Gray Tick)
    if (this.config && this.config.imageId) {
      PuzzleStatusStore.markStarted(this.config.imageId);
    }
  }

  /**
   * Calculate current game rating based on moves, distance, time, and piece count.
   * Extracted to eliminate code duplication across undo/redo/normal gameplay.
   */
  _calculateCurrentRating() {
    return calculateSmartRating({
      moveCount: this.movementTracker.moveCount,
      totalDistance: Math.round(this.movementTracker.totalDistance),
      timeSeconds: this.timer ? this.timer.getElapsedSeconds() : 0,
      totalPieces: this.puzzle ? this.puzzle.pieces.length : 25
    });
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
    if (!this.config || !this.config.processedImage || !this.gameView) return;

    // 1st Confirmation Toast
    this.gameView.showToast({
      title: "Peek Reference?",
      description: "Do you want to peek at the reference image?",
      type: "warning",
      autoDismiss: false,
      actions: [
        {
          id: "toast-btn-peek-cancel",
          label: "Cancel",
          primary: false,
          onClick: () => {
            // Dismissed
          }
        },
        {
          id: "toast-btn-peek-confirm",
          label: "Confirm",
          primary: true,
          onClick: () => {
            // 2nd Confirmation Toast
            setTimeout(() => {
              this.gameView.showToast({
                title: "Cheater Alert! 🚨",
                description: "Are you sure you want to check? (This is cheating!)",
                type: "error",
                autoDismiss: false,
                actions: [
                  {
                    id: "toast-btn-cheat-no",
                    label: "No",
                    primary: false,
                    onClick: () => {
                      // Dismissed
                    }
                  },
                  {
                    id: "toast-btn-cheat-yes",
                    label: "Yes, Cheat",
                    primary: true,
                    onClick: () => {
                      // Confirmed cheat, reveal modal!
                      this.gameView.showReferenceModal(this.config.processedImage.canvas);
                    }
                  }
                ]
              });
            }, 100);
          }
        }
      ]
    });
  }

  addHintTokens(count) {
    this.hintsRemaining += count;
    if (this.gameView) {
      this.gameView.updateSmartHintCount(this.hintsRemaining);
    }
  }

  handleSmartHint() {
    if (!this.puzzle || !this.renderer || !this.app) return;

    if (this.app.stateMachine.state === 'SOLVED') {
      return;
    }

    // Cooldown check: if button is disabled/cooldown active, skip click
    const btn = this.gameView ? this.gameView.element.querySelector("#hud-btn-smart-hint") : null;
    if (btn && btn.disabled) return;

    if (this.hintsRemaining <= 0) {
      if (this.gameView && this.gameView.showToast) {
        this.gameView.showToast({
          title: "Hint Limit",
          description: "No hints remaining!",
          type: "warning"
        });
      }
      return;
    }

    const incorrectPieces = this.puzzle.pieces.filter(p => !PuzzleValidator.isPieceInCorrectSlot(p));
    if (incorrectPieces.length === 0) {
      if (this.gameView && this.gameView.showToast) {
        this.gameView.showToast({
          title: "Smart Hint",
          description: "All pieces are in correct slots!",
          type: "success"
        });
      }
      return;
    }

    this.hintsRemaining--;
    if (this.gameView) {
      this.gameView.updateSmartHintCount(this.hintsRemaining);
      
      const settings = SettingsStore.getSettings();
      const delay = settings.hintCooldown || 4;
      this.gameView.startSmartHintCooldown(delay);
    }
    this.renderer.highlightAllIncorrectPieces(incorrectPieces.map(p => p.id));
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
        onPuzzleComplete: () => this.handlePuzzleCompletion(),
        onSwap: (pieceA, pieceB, gridA, gridB) => this.recordSwap(pieceA, pieceB, gridA, gridB),
        onNearMiss: () => this.handleNearMiss()
      });
    }
  }

  recordSwap(pieceA, pieceB, gridA, gridB) {
    this.undoStack.push({
      pieceAId: pieceA.id,
      pieceBId: pieceB.id,
      gridA: { ...gridA },
      gridB: { ...gridB }
    });
    this.redoStack = []; // Clear redo stack on new moves
    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const move = this.undoStack.pop();
    this.redoStack.push(move);

    // Swap A back to slot A, B back to slot B
    this.executeSwap(move.pieceAId, move.pieceBId, move.gridA, move.gridB);

    if (this.movementTracker) {
      this.movementTracker.moveCount = Math.max(0, this.movementTracker.moveCount - 1);
      // Trigger stat recalculation
      const currentRating = this._calculateCurrentRating();
      this.gameView.updateHUD({
        moves: this.movementTracker.moveCount,
        rating: currentRating
      });
    }

    this.updateUndoRedoButtons();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const move = this.redoStack.pop();
    this.undoStack.push(move);

    // Swap A back to slot B, B back to slot A (executing the swap again)
    this.executeSwap(move.pieceAId, move.pieceBId, move.gridB, move.gridA);

    if (this.movementTracker) {
      this.movementTracker.moveCount += 1;
      // Trigger stat recalculation
      const currentRating = this._calculateCurrentRating();
      this.gameView.updateHUD({
        moves: this.movementTracker.moveCount,
        rating: currentRating
      });
    }

    this.updateUndoRedoButtons();
  }

  executeSwap(pieceAId, pieceBId, gridSlotA, gridSlotB) {
    const pieceA = this.puzzle.pieces.find(p => p.id === pieceAId);
    const pieceB = this.puzzle.pieces.find(p => p.id === pieceBId);

    if (pieceA && pieceB) {
      pieceA.currentGridRow = gridSlotA.row;
      pieceA.currentGridCol = gridSlotA.col;
      pieceB.currentGridRow = gridSlotB.row;
      pieceB.currentGridCol = gridSlotB.col;

      const coordsA = this.puzzle.getSlotCoordinates(gridSlotA.row, gridSlotA.col);
      const coordsB = this.puzzle.getSlotCoordinates(gridSlotB.row, gridSlotB.col);

      pieceA.setPosition(coordsA.x, coordsA.y);
      pieceB.setPosition(coordsB.x, coordsB.y);

      pieceA.placed = PuzzleValidator.isPieceInCorrectSlot(pieceA);
      pieceA.locked = pieceA.placed;
      pieceB.placed = PuzzleValidator.isPieceInCorrectSlot(pieceB);
      pieceB.locked = pieceB.placed;

      const spriteA = this.renderer.getSpriteForPiece(pieceA);
      const spriteB = this.renderer.getSpriteForPiece(pieceB);

      if (spriteA) PieceAnimations.animateSnap(spriteA, coordsA.x, coordsA.y);
      if (spriteB) PieceAnimations.animateSnap(spriteB, coordsB.x, coordsB.y);

      // Play swap sound
      SoundEffects.playMoveSound();

      if (this.puzzle.checkCompletion()) {
        SoundEffects.playWinSound();
        this.handlePuzzleCompletion();
      } else {
        if (this.app && this.app.stateMachine && this.app.stateMachine.state === 'SOLVED') {
          this.app.stateMachine.transitionTo('RUNNING');
          if (this.timer) this.timer.start();
          if (this.renderer && typeof this.renderer.stopCompletionAnimation === 'function') {
            this.renderer.stopCompletionAnimation();
          }
          if (this.gameView) {
            this.gameView.updateHUD({
              mode: this.config.mode,
              difficulty: this.config.difficulty
            });
          }
        }
      }
    }
  }

  updateUndoRedoButtons() {
    if (this.gameView) {
      this.gameView.updateUndoRedo(this.undoStack.length > 0, this.redoStack.length > 0);
    }
  }

  handleFirstMovement() {
    if (this.app.stateMachine.state === GameStates.READY) {
      this.app.stateMachine.transitionTo(GameStates.RUNNING);
      this.timer.start();

      // Start inactivity tracking
      this.lastActivityTime = Date.now();
      window.addEventListener('pointerdown', this.resetActivityListener);

      this.inactivityInterval = setInterval(() => {
        if (this.app.stateMachine.state !== GameStates.RUNNING) return;
        const idleTime = (Date.now() - this.lastActivityTime) / 1000;
        if (idleTime >= 6.5) { // 6.5 seconds trigger
          this.triggerInactivityToast();
        }
      }, 1000);
    }
  }

  async handlePuzzleCompletion() {
    const elapsedMs = this.timer.stop();
    this.cleanupInactivityTracker();
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

    // Play satisfying sequential snapping wave locking animation
    if (this.renderer) {
      this.renderer.playWaveLockingAnimation(() => {
        // After wave snaps propagate and lock:
        SoundEffects.playWinSound();

        // 1. Play victory glowing animated border on Pixi canvas
        this.renderer.playCompletionAnimation(this.puzzle.boardLayout);

        // 2. Show non-blocking status feedback in HUD
        if (this.gameView) {
          this.gameView.showCompletionState({ rating: finalRating });

          // 3. Show congrats toast notification with action buttons to choose image or play again
          this.gameView.showToast({
            title: "🎉 Puzzle Solved!",
            description: `Great job! Time: ${finalTimeStr} | Moves: ${finalMoves}m | Distance: ${finalDistance}px`,
            type: "success",
            autoDismiss: false,
            actions: [
              {
                id: "toast-btn-home",
                label: "Choose Image",
                primary: false,
                onClick: () => {
                  if (this.resultView && this.resultView.onChooseImage) {
                    this.resultView.onChooseImage();
                  }
                }
              },
              {
                id: "toast-btn-again",
                label: "Play Again",
                primary: true,
                onClick: () => {
                  if (this.resultView && this.resultView.onPlayAgain) {
                    this.resultView.onPlayAgain();
                  }
                }
              }
            ]
          });
        }
      });
    } else {
      SoundEffects.playWinSound();
      if (this.gameView) {
        this.gameView.showCompletionState({ rating: finalRating });
        this.gameView.showToast({
          title: "🎉 Puzzle Solved!",
          description: `Great job! Time: ${finalTimeStr} | Moves: ${finalMoves}m | Distance: ${finalDistance}px`,
          type: "success",
          autoDismiss: false,
          actions: [
            {
              id: "toast-btn-home",
              label: "Choose Image",
              primary: false,
              onClick: () => {
                if (this.resultView && this.resultView.onChooseImage) {
                  this.resultView.onChooseImage();
                }
              }
            },
            {
              id: "toast-btn-again",
              label: "Play Again",
              primary: true,
              onClick: () => {
                if (this.resultView && this.resultView.onPlayAgain) {
                  this.resultView.onPlayAgain();
                }
              }
            }
          ]
        });
      }
    }

    // Save match result into IndexedDB
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
    this.cleanupInactivityTracker();
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

  handleNearMiss() {
    if (this.app.stateMachine.state !== GameStates.RUNNING) return;
    this.triggerNearMissToast();
  }

  triggerNearMissToast() {
    const settings = SettingsStore.getSettings();
    if (settings.assistantToasts === false) return;

    const now = Date.now();
    // 10s cooldown
    if (this.lastToastTime && (now - this.lastToastTime) < 10000) {
      return;
    }

    if (this.pendingToastTimeout) {
      return;
    }

    const list = [
      "Bro you looked right at it.",
      "It’s literally right there.",
      "I watched you skip over it three times.",
      "You walked past the answer like it was invisible."
    ];
    const message = this._selectUniqueMessage(list);

    // Shift lastActivityTime to prevent inactivity toast from firing during delay
    this.lastActivityTime = now + 5000;

    const delayMs = 3000 + Math.random() * 1000;
    this.pendingToastTimeout = setTimeout(() => {
      this.pendingToastTimeout = null;

      if (this.app.stateMachine.state !== GameStates.RUNNING) return;
      const unsolvedCount = this.puzzle ? this.puzzle.pieces.filter(p => !p.locked).length : 0;
      if (unsolvedCount === 0) return;

      this.lastToastTime = Date.now();
      this.lastActivityTime = Date.now();
      this.inactivityStreak = 0;

      if (this.gameView && this.gameView.showToast) {
        this.gameView.showToast({
          title: "Roast",
          description: `${message}\n(You can disable this in Settings)`,
          type: "info"
        });
      }
    }, delayMs);
  }

  triggerInactivityToast() {
    const settings = SettingsStore.getSettings();
    if (settings.assistantToasts === false) return;

    const now = Date.now();
    // Cooldown check (exactly 10 seconds)
    if (this.lastToastTime && (now - this.lastToastTime) < 10000) {
      return;
    }

    if (this.pendingToastTimeout) {
      return;
    }

    const unsolvedCount = this.puzzle ? this.puzzle.pieces.filter(p => !p.locked).length : 0;
    if (unsolvedCount === 0) return;

    // Shift lastActivityTime to prevent double triggers during delay
    this.lastActivityTime = now + 5000;

    const delayMs = 3000 + Math.random() * 1000;
    this.pendingToastTimeout = setTimeout(() => {
      this.pendingToastTimeout = null;

      if (this.app.stateMachine.state !== GameStates.RUNNING) return;
      const finalUnsolvedCount = this.puzzle ? this.puzzle.pieces.filter(p => !p.locked).length : 0;
      if (finalUnsolvedCount === 0) return;

      this.inactivityStreak = (this.inactivityStreak || 0) + 1;

      let message = "";
      let toastTitle = "Assistant";
      let toastType = "info";

      // 1. Close state (<= 3 pieces remaining)
      if (finalUnsolvedCount <= 3) {
        toastTitle = "Hint";
        toastType = "warning";
        const isRoast = Math.random() < 0.4; // 40% soft roast, 60% warning
        if (isRoast) {
          const list = [
            "Don’t choke now.",
            "One more second and you would’ve got it.",
            "You were so close it hurt."
          ];
          message = this._selectUniqueMessage(list);
        } else {
          const list = [
            "You’re right on top of it.",
            "Don’t look away now."
          ];
          message = this._selectUniqueMessage(list);
        }
      }
      // 2. Stuck State Escalation (idle for consecutive checks)
      else if (this.inactivityStreak >= 2) {
        toastTitle = "Stuck?";
        toastType = "warning";
        if (this.inactivityStreak === 2) {
          // Mild stuck messages
          const list = [
            "Still nothing?",
            "Maybe step back for a second."
          ];
          message = this._selectUniqueMessage(list);
        } else if (this.inactivityStreak === 3) {
          // Medium stuck messages
          const list = [
            "You’ve been on this one too long.",
            "The picture isn’t changing. You are."
          ];
          message = this._selectUniqueMessage(list);
        } else {
          // Third+ stuck message -> Supportive or deep stuck message
          const list = [
            "It’s not that deep… but also it is.",
            "One more look. You’ve got this.",
            "You’re doing better than you think.",
            "It’s supposed to feel messy. You’re fine."
          ];
          message = this._selectUniqueMessage(list);
          toastTitle = "Support";
          toastType = "info";
        }
      }
      // 3. General Inactivity (First idle warn)
      else {
        const isSupportive = Math.random() < 0.3; // 30% supportive, 70% teasing roasts
        if (isSupportive) {
          toastTitle = "Support";
          toastType = "info";
          const list = [
            "You’re doing better than you think.",
            "Keep going, you’re close.",
            "Most people give up here.",
            "You already found the hard ones.",
            "One more look. You’ve got this.",
            "It’s supposed to feel messy. You’re fine."
          ];
          message = this._selectUniqueMessage(list);
        } else {
          toastTitle = "Roast";
          toastType = "info";
          const list = [
            "Bro you looked right at it.",
            "It’s literally right there.",
            "You’re gonna hate yourself when you see it.",
            "I watched you skip over it three times.",
            "That one is not even trying to hide.",
            "You’re making this harder than it needs to be.",
            "The thing is staring at you.",
            "You almost had it and then just… left.",
            "This is getting sad.",
            "You’re circling the same empty spot again.",
            "It’s not moving. You are.",
            "Okay that one was kind of obvious.",
            "You walked past the answer like it was invisible.",
            "I need you to look harder.",
            "That detail has been waiting for you."
          ];
          message = this._selectUniqueMessage(list);
        }
      }

      this.lastToastTime = Date.now();
      this.lastActivityTime = Date.now();

      if (this.gameView && this.gameView.showToast) {
        this.gameView.showToast({
          title: toastTitle,
          description: `${message}\n(You can disable this in Settings)`,
          type: toastType
        });
      }
    }, delayMs);
  }

  _selectUniqueMessage(list) {
    if (!this.shownMessageHistory) {
      this.shownMessageHistory = [];
    }
    let candidates = list.filter(msg => !this.shownMessageHistory.includes(msg));
    if (candidates.length === 0) {
      candidates = list;
    }
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    this.shownMessageHistory.push(selected);
    if (this.shownMessageHistory.length > 4) {
      this.shownMessageHistory.shift();
    }
    return selected;
  }

  showWelcomeToast() {
    const settings = SettingsStore.getSettings();
    if (settings.assistantToasts === false) return;

    if (this.gameView && this.gameView.showToast) {
      this.gameView.showToast({
        title: "Welcome",
        description: "Welcome to PixelCraft! Drag and swap pieces to solve the puzzle.\n(You can disable this in Settings)",
        type: "success",
        autoDismiss: true
      });
    }
  }

  cleanupInactivityTracker() {
    if (this.inactivityInterval) {
      clearInterval(this.inactivityInterval);
      this.inactivityInterval = null;
    }
    if (this.pendingToastTimeout) {
      clearTimeout(this.pendingToastTimeout);
      this.pendingToastTimeout = null;
    }
    window.removeEventListener('pointerdown', this.resetActivityListener);
  }
}
