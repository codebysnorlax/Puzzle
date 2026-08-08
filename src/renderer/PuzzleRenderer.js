import { Container, Graphics, Texture } from 'pixi.js';
import { PieceRenderer } from './PieceRenderer.js';

/**
 * PuzzleRenderer — PixiJS stage manager for puzzle board target slots, piece containers, and active rendering
 */
export class PuzzleRenderer {
  constructor(pixiApp) {
    this.pixiApp = pixiApp;
    this.stage = pixiApp.app.stage;

    this.boardContainer = new Container();
    this.piecesContainer = new Container();
    this.piecesContainer.sortableChildren = true;

    this.stage.addChild(this.boardContainer);
    this.stage.addChild(this.piecesContainer);

    this.pieceSpritesMap = new Map(); // piece.id -> Container
  }

  /**
   * Render board target slot grid backdrop
   */
  renderBoardTarget(boardLayout, mode = 'normal') {
    this.boardContainer.removeChildren();

    const shadow = new Graphics();
    shadow.roundRect(boardLayout.x + 3, boardLayout.y + 3, boardLayout.width, boardLayout.height, 8);
    shadow.fill({ color: 0x000000, alpha: 0.3 });

    const boardOutline = new Graphics();
    boardOutline.roundRect(boardLayout.x, boardLayout.y, boardLayout.width, boardLayout.height, 8);
    boardOutline.fill({ color: 0x18202c, alpha: 0.6 });
    boardOutline.stroke({ width: 2, color: 0x3b4d68, alpha: 0.8 });

    this.boardContainer.addChild(shadow);
    this.boardContainer.addChild(boardOutline);
  }

  /**
   * Load base Pixi Texture from image HTMLCanvasElement and instantiate all piece sprites
   */
  async renderPuzzle(puzzle, imageCanvas, mode = 'normal') {
    this.clear();
    this.renderBoardTarget(puzzle.boardLayout, mode);

    const baseTexture = Texture.from(imageCanvas);

    puzzle.pieces.forEach(piece => {
      const spriteContainer = PieceRenderer.createPieceSprite(piece, baseTexture, mode);
      this.piecesContainer.addChild(spriteContainer);
      this.pieceSpritesMap.set(piece.id, spriteContainer);
    });
  }

  /**
   * Re-render board target and update sprite positions on viewport resize
   */
  resize(puzzle, imageCanvas, mode = 'normal') {
    if (!puzzle || !imageCanvas) return;
    this.renderPuzzle(puzzle, imageCanvas, mode);
  }

  /**
   * Update Pixi sprite positions to match piece model state
   */
  updatePiecePositions(pieces) {
    pieces.forEach(piece => {
      const sprite = this.pieceSpritesMap.get(piece.id);
      if (sprite) {
        sprite.x = piece.x;
        sprite.y = piece.y;
        if (piece.locked) {
          sprite.cursor = 'default';
          sprite.zIndex = 0;
        }
      }
    });
  }

  getSpriteForPiece(piece) {
    return this.pieceSpritesMap.get(piece.id);
  }

  clear() {
    this.piecesContainer.removeChildren();
    this.boardContainer.removeChildren();
    this.pieceSpritesMap.clear();
  }
}
