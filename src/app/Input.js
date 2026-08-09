import { PuzzleValidator } from '../puzzle/PuzzleValidator.js';
import { PieceAnimations } from '../animation/PieceAnimations.js';
import { SoundEffects } from '../game/SoundEffects.js';

/**
 * InputHandler — Unified Pointer Handler with Local Container Coordinate Transformation & Safe Animation Scoping
 */
export class InputHandler {
  constructor({ puzzle, puzzleRenderer, timer, movementTracker, onPuzzleComplete, onFirstMovement }) {
    this.puzzle = puzzle;
    this.renderer = puzzleRenderer;
    this.timer = timer;
    this.movementTracker = movementTracker;
    this.onPuzzleComplete = onPuzzleComplete;
    this.onFirstMovement = onFirstMovement;

    this.activePiece = null;
    this.startGridPos = { x: 0, y: 0 };
    this.dragOffset = { x: 0, y: 0 };
    this.isDragging = false;
    this.hoveredPiece = null;

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
    this.isDragging = true;
    this.activePiece = piece;
    this.startGridPos = { x: piece.x, y: piece.y };

    const localPos = this.getLocalPointerPos(event);
    this.dragOffset = {
      x: localPos.x - piece.x,
      y: localPos.y - piece.y
    };

    spriteContainer.zIndex = 1000;
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
    this.movementTracker.recordDragEnd();

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
      const targetGridX = cell.targetX;
      const targetGridY = cell.targetY;
      const sourceGridX = this.startGridPos.x;
      const sourceGridY = this.startGridPos.y;

      draggedPiece.setPosition(targetGridX, targetGridY);
      targetPiece.setPosition(sourceGridX, sourceGridY);

      draggedPiece.placed = PuzzleValidator.isPieceInCorrectSlot(draggedPiece);
      draggedPiece.locked = draggedPiece.placed;

      targetPiece.placed = PuzzleValidator.isPieceInCorrectSlot(targetPiece);
      targetPiece.locked = targetPiece.placed;

      const targetSprite = this.renderer.getSpriteForPiece(targetPiece);

      PieceAnimations.animateSnap(activeSprite, targetGridX, targetGridY, () => {
        if (draggedPiece && draggedPiece.placed) PieceAnimations.animateLockPop(activeSprite);
      });

      PieceAnimations.animateSnap(targetSprite, sourceGridX, sourceGridY, () => {
        if (targetPiece && targetPiece.placed) PieceAnimations.animateLockPop(targetSprite);
      });
    } else {
      draggedPiece.setPosition(this.startGridPos.x, this.startGridPos.y);
      PieceAnimations.animateSnap(activeSprite, this.startGridPos.x, this.startGridPos.y);
    }

    this.activePiece = null;
    SoundEffects.playMoveSound();

    if (this.puzzle.checkCompletion()) {
      SoundEffects.playWinSound();
      if (this.onPuzzleComplete) {
        this.onPuzzleComplete();
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
