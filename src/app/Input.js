import { PuzzleValidator } from '../puzzle/PuzzleValidator.js';
import { PieceAnimations } from '../animation/PieceAnimations.js';

/**
 * InputHandler — Unified Pointer Handler for Forgiving Grid Tile Swap Gameplay
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

    const globalPos = event.global || { x: event.clientX, y: event.clientY };
    this.dragOffset = {
      x: globalPos.x - piece.x,
      y: globalPos.y - piece.y
    };

    // Elevate z-index for drag feedback
    spriteContainer.zIndex = 1000;
    this.movementTracker.recordDragStart(globalPos.x, globalPos.y);
  }

  onPointerMove(event) {
    if (!this.isDragging || !this.activePiece) return;

    const globalPos = { x: event.clientX, y: event.clientY };

    // Record movement metrics
    this.movementTracker.recordDragMove(globalPos.x, globalPos.y);

    // Trigger auto timer start on first movement
    if (this.movementTracker.hasMovedMeaningfully && this.onFirstMovement) {
      this.onFirstMovement();
    }

    // Drag active piece
    this.activePiece.setPosition(
      globalPos.x - this.dragOffset.x,
      globalPos.y - this.dragOffset.y
    );
    this.renderer.updatePiecePositions([this.activePiece]);

    // Check which grid cell is under cursor / tile center
    const tileCenterX = this.activePiece.x + this.activePiece.width / 2;
    const tileCenterY = this.activePiece.y + this.activePiece.height / 2;
    const cell = this.getGridCellAtPointer(globalPos.x, globalPos.y) || this.getGridCellAtPointer(tileCenterX, tileCenterY);

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
    const globalPos = { x: event.clientX, y: event.clientY };
    this.movementTracker.recordDragEnd();

    // Reset hover highlight
    if (this.hoveredPiece) {
      const sprite = this.renderer.getSpriteForPiece(this.hoveredPiece);
      if (sprite) {
        sprite.alpha = 1.0;
        sprite.scale.set(1.0);
      }
      this.hoveredPiece = null;
    }

    const activeSprite = this.renderer.getSpriteForPiece(this.activePiece);
    if (activeSprite) activeSprite.zIndex = 1;

    // Use forgiving grid cell projection (checks cursor position first, then tile center)
    const tileCenterX = this.activePiece.x + this.activePiece.width / 2;
    const tileCenterY = this.activePiece.y + this.activePiece.height / 2;
    const cell = this.getGridCellAtPointer(globalPos.x, globalPos.y) || this.getGridCellAtPointer(tileCenterX, tileCenterY);

    if (cell && cell.targetPiece && cell.targetPiece !== this.activePiece) {
      const targetPiece = cell.targetPiece;
      const targetGridX = cell.targetX;
      const targetGridY = cell.targetY;
      const sourceGridX = this.startGridPos.x;
      const sourceGridY = this.startGridPos.y;

      // Update positions in data model
      this.activePiece.setPosition(targetGridX, targetGridY);
      targetPiece.setPosition(sourceGridX, sourceGridY);

      // Check correctness
      this.activePiece.placed = PuzzleValidator.isPieceInCorrectSlot(this.activePiece);
      this.activePiece.locked = this.activePiece.placed;

      targetPiece.placed = PuzzleValidator.isPieceInCorrectSlot(targetPiece);
      targetPiece.locked = targetPiece.placed;

      // Animate tile swap transitions
      const targetSprite = this.renderer.getSpriteForPiece(targetPiece);

      PieceAnimations.animateSnap(activeSprite, targetGridX, targetGridY, () => {
        if (this.activePiece.placed) PieceAnimations.animateLockPop(activeSprite);
      });

      PieceAnimations.animateSnap(targetSprite, sourceGridX, sourceGridY, () => {
        if (targetPiece.placed) PieceAnimations.animateLockPop(targetSprite);
      });

      console.log(`[Input] Tile Swapped: Piece ${this.activePiece.id} ◄► Piece ${targetPiece.id} at Grid (${cell.row}, ${cell.col})`);
    } else {
      // Revert back to original starting grid position
      this.activePiece.setPosition(this.startGridPos.x, this.startGridPos.y);
      PieceAnimations.animateSnap(activeSprite, this.startGridPos.x, this.startGridPos.y);
    }

    this.activePiece = null;

    // Check completion
    if (this.puzzle.checkCompletion()) {
      if (this.onPuzzleComplete) {
        this.onPuzzleComplete();
      }
    }
  }

  /**
   * Forgiving mathematical grid cell calculator derived from pointer or tile center
   */
  getGridCellAtPointer(px, py) {
    if (!this.puzzle || !this.puzzle.boardLayout || !this.puzzle.grid) return null;

    const board = this.puzzle.boardLayout;
    const { rows, cols } = this.puzzle.grid;
    const pieceW = board.width / cols;
    const pieceH = board.height / rows;

    // Allow a generous 50px margin around board perimeter
    const margin = 50;
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

    // Find piece currently residing at (targetX, targetY)
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
