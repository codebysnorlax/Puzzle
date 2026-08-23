import { PuzzleValidator } from '../puzzle/PuzzleValidator.js';
import { PieceAnimations } from '../animation/PieceAnimations.js';
import { SoundEffects } from '../game/SoundEffects.js';

/**
 * InputHandler — Unified Pointer Handler with Local Container Coordinate Transformation & Safe Animation Scoping
 */
export class InputHandler {
  constructor({ puzzle, puzzleRenderer, timer, movementTracker, onPuzzleComplete, onFirstMovement, onSwap, onNearMiss }) {
    this.puzzle = puzzle;
    this.renderer = puzzleRenderer;
    this.timer = timer;
    this.movementTracker = movementTracker;
    this.onPuzzleComplete = onPuzzleComplete;
    this.onFirstMovement = onFirstMovement;
    this.onSwap = onSwap;
    this.onNearMiss = onNearMiss;

    this.activePiece = null;
    this.startGridPos = { x: 0, y: 0 };
    this.dragOffset = { x: 0, y: 0 };
    this.isDragging = false;
    this.hoveredPiece = null;
    this.hoveredCorrectSlotDuringDrag = false;

    this.bindEvents();
  }

  getLocalPointerPos(event) {
    const container = this.renderer && this.renderer.pixiApp ? this.renderer.pixiApp.container : null;
    const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
    
    let clientX = 0;
    let clientY = 0;

    if (event.clientX !== undefined && event.clientY !== undefined) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event.global) {
      clientX = event.global.x;
      clientY = event.global.y;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      rawX: clientX,
      rawY: clientY
    };
  }

  bindEvents() {
    this.renderer.piecesContainer.children.forEach(spriteContainer => {
      const piece = spriteContainer.pieceData;
      if (!piece) return;

      spriteContainer.on('pointerdown', (e) => this.onPointerDown(e, piece, spriteContainer));
    });

    this.onPointerMoveRef = (e) => this.onPointerMove(e);
    this.onPointerUpRef = (e) => this.onPointerUp(e);

    window.addEventListener('pointermove', this.onPointerMoveRef);
    window.addEventListener('pointerup', this.onPointerUpRef);
    window.addEventListener('pointercancel', this.onPointerUpRef);
  }

  onPointerDown(event, piece, spriteContainer) {
    const stateMachine = this.renderer && this.renderer.pixiApp && this.renderer.pixiApp.app ? this.renderer.pixiApp.app.stateMachine : null;
    if (stateMachine && stateMachine.state === 'SOLVED') {
      return;
    }

    if (this.renderer && typeof this.renderer.stopCompletionAnimation === 'function') {
      this.renderer.stopCompletionAnimation();
    }

    this.isDragging = true;
    this.activePiece = piece;
    this.startGridPos = { x: piece.x, y: piece.y };
    this.startGridRow = piece.currentGridRow;
    this.startGridCol = piece.currentGridCol;

    const localPos = this.getLocalPointerPos(event);
    this.dragOffset = {
      x: localPos.x - piece.x,
      y: localPos.y - piece.y
    };

    spriteContainer.zIndex = 1000;
    this.hoveredCorrectSlotDuringDrag = false;
    this.movementTracker.recordDragStart(localPos.rawX, localPos.rawY);
  }

  onPointerMove(event) {
    if (!this.isDragging || !this.activePiece) return;

    const localPos = this.getLocalPointerPos(event);

    this.movementTracker.recordDragMove(localPos.rawX, localPos.rawY);

    if (this.movementTracker.hasMovedMeaningfully && this.onFirstMovement) {
      this.onFirstMovement();
    }

    // Move piece relative to local canvas container
    this.activePiece.setPosition(
      localPos.x - this.dragOffset.x,
      localPos.y - this.dragOffset.y
    );
    this.renderer.updatePiecePositions([this.activePiece]);

    // Check hovered target cell
    const cell = this.getGridCellAtPointer(localPos.x, localPos.y);

    // Near miss detection: check if they hovered the piece over its correct slot
    if (cell && cell.row === this.activePiece.row && cell.col === this.activePiece.col) {
      this.hoveredCorrectSlotDuringDrag = true;
    }

    const targetCandidate = (cell && cell.targetPiece !== this.activePiece) ? cell.targetPiece : null;

    if (targetCandidate !== this.hoveredPiece) {
      if (this.hoveredPiece) {
        const sprite = this.renderer.getSpriteForPiece(this.hoveredPiece);
        if (sprite) {
          sprite.alpha = 1.0;
          sprite.scale.set(1.0);
        }
      }
      this.hoveredPiece = targetCandidate;
      if (this.hoveredPiece) {
        const sprite = this.renderer.getSpriteForPiece(this.hoveredPiece);
        if (sprite) {
          sprite.alpha = 0.8;
          sprite.scale.set(0.96);
        }
      }
    }
  }

  onPointerUp(event) {
    if (!this.isDragging || !this.activePiece) return;

    this.isDragging = false;
    const localPos = this.getLocalPointerPos(event);

    if (this.hoveredPiece) {
      const sprite = this.renderer.getSpriteForPiece(this.hoveredPiece);
      if (sprite) {
        sprite.alpha = 1.0;
        sprite.scale.set(1.0);
      }
      this.hoveredPiece = null;
    }

    const draggedPiece = this.activePiece;
    const activeSprite = this.renderer.getSpriteForPiece(draggedPiece);
    if (activeSprite) activeSprite.zIndex = 1;

    const cell = this.getGridCellAtPointer(localPos.x, localPos.y);

    if (cell && cell.targetPiece && cell.targetPiece !== draggedPiece) {
      const targetPiece = cell.targetPiece;
      const targetSlotRow = cell.row;
      const targetSlotCol = cell.col;
      const sourceSlotRow = this.startGridRow !== undefined ? this.startGridRow : targetPiece.currentGridRow;
      const sourceSlotCol = this.startGridCol !== undefined ? this.startGridCol : targetPiece.currentGridCol;

      // Record swap history for undo/redo before changing positions
      if (this.onSwap) {
        this.onSwap(
          draggedPiece,
          targetPiece,
          { row: sourceSlotRow, col: sourceSlotCol },
          { row: targetSlotRow, col: targetSlotCol }
        );
      }

      const draggedCoords = this.puzzle.getSlotCoordinates ? this.puzzle.getSlotCoordinates(targetSlotRow, targetSlotCol) : { x: cell.targetX, y: cell.targetY };
      const sourceCoords = (this.puzzle.getSlotCoordinates && sourceSlotRow !== undefined) ? this.puzzle.getSlotCoordinates(sourceSlotRow, sourceSlotCol) : this.startGridPos;

      draggedPiece.currentGridRow = targetSlotRow;
      draggedPiece.currentGridCol = targetSlotCol;
      targetPiece.currentGridRow = sourceSlotRow;
      targetPiece.currentGridCol = sourceSlotCol;

      draggedPiece.setPosition(draggedCoords.x, draggedCoords.y);
      targetPiece.setPosition(sourceCoords.x, sourceCoords.y);

      draggedPiece.placed = PuzzleValidator.isPieceInCorrectSlot(draggedPiece);
      draggedPiece.locked = draggedPiece.placed;

      if (!draggedPiece.placed && this.hoveredCorrectSlotDuringDrag) {
        if (this.onNearMiss) {
          this.onNearMiss();
        }
      }

      targetPiece.placed = PuzzleValidator.isPieceInCorrectSlot(targetPiece);
      targetPiece.locked = targetPiece.placed;

      const targetSprite = this.renderer.getSpriteForPiece(targetPiece);

      PieceAnimations.animateSnap(activeSprite, draggedCoords.x, draggedCoords.y);
      PieceAnimations.animateSnap(targetSprite, sourceCoords.x, sourceCoords.y);
      
      // Play sound ONLY when successfully swapped
      SoundEffects.playMoveSound();

      // Successfully swapped / position changed!
      this.movementTracker.recordDragEnd(true);
    } else {
      draggedPiece.setPosition(this.startGridPos.x, this.startGridPos.y);
      PieceAnimations.animateSnap(activeSprite, this.startGridPos.x, this.startGridPos.y);

      // Dropped back onto original slot / position unchanged!
      this.movementTracker.recordDragEnd(false);
    }

    this.activePiece = null;

    if (this.puzzle.checkCompletion()) {
      SoundEffects.playWinSound();
      if (this.onPuzzleComplete) {
        this.onPuzzleComplete();
      }
    } else {
      const stateMachine = this.renderer && this.renderer.pixiApp && this.renderer.pixiApp.app ? this.renderer.pixiApp.app.stateMachine : null;
      if (stateMachine && stateMachine.state === 'SOLVED') {
        stateMachine.transitionTo('RUNNING');
        if (this.timer) this.timer.start();
        if (this.renderer && typeof this.renderer.stopCompletionAnimation === 'function') {
          this.renderer.stopCompletionAnimation();
        }
        const gameView = this.renderer && this.renderer.pixiApp && this.renderer.pixiApp.app ? this.renderer.pixiApp.app.gameView : null;
        const config = this.renderer && this.renderer.pixiApp && this.renderer.pixiApp.app && this.renderer.pixiApp.app.activeConfig;
        if (gameView && config) {
          gameView.updateHUD({
            mode: config.mode,
            difficulty: config.difficulty
          });
        }
      }
    }
  }

  getGridCellAtPointer(px, py) {
    if (!this.puzzle || !this.puzzle.boardLayout || !this.puzzle.grid) return null;

    const board = this.puzzle.boardLayout;
    const { rows, cols } = this.puzzle.grid;
    const pieceW = board.width / cols;
    const pieceH = board.height / rows;

    const margin = 40;
    if (
      px < board.x - margin ||
      px > board.x + board.width + margin ||
      py < board.y - margin ||
      py > board.y + board.height + margin
    ) {
      return null;
    }

    let col = Math.floor((px - board.x) / pieceW);
    let row = Math.floor((py - board.y) / pieceH);

    col = Math.max(0, Math.min(cols - 1, col));
    row = Math.max(0, Math.min(rows - 1, row));

    const targetX = Math.round(board.x + col * pieceW);
    const targetY = Math.round(board.y + row * pieceH);

    const targetPiece = this.puzzle.pieces.find(p => {
      return Math.abs(p.x - targetX) < 5 && Math.abs(p.y - targetY) < 5;
    });

    return { row, col, targetX, targetY, targetPiece };
  }

  destroy() {
    window.removeEventListener('pointermove', this.onPointerMoveRef);
    window.removeEventListener('pointerup', this.onPointerUpRef);
    window.removeEventListener('pointercancel', this.onPointerUpRef);
  }
}
