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
    // Drop shadow behind board
    shadow.roundRect(boardLayout.x + 4, boardLayout.y + 4, boardLayout.width, boardLayout.height, 12);
    shadow.fill({ color: 0x000000, alpha: 0.4 });

    // Target board outline
    const boardOutline = new Graphics();
    boardOutline.roundRect(boardLayout.x, boardLayout.y, boardLayout.width, boardLayout.height, 12);
    boardOutline.fill({ color: 0x1e293b, alpha: 0.5 });
    boardOutline.stroke({ width: 2, color: 0x475569, alpha: 0.8 });

    this.boardContainer.addChild(shadow);
    this.boardContainer.addChild(boardOutline);
  }

  /**
   * Load base Pixi Texture from image HTMLCanvasElement and instantiate all piece sprites
   */
  async renderPuzzle(puzzle, imageCanvas, mode = 'normal') {
    this.clear();
    this.renderBoardTarget(puzzle.boardLayout, mode);

    // Create Pixi Texture from image canvas
    const baseTexture = Texture.from(imageCanvas);

    puzzle.pieces.forEach(piece => {
      const spriteContainer = PieceRenderer.createPieceSprite(piece, baseTexture, mode);
      this.piecesContainer.addChild(spriteContainer);
      this.pieceSpritesMap.set(piece.id, spriteContainer);
    });

    console.log(`[PuzzleRenderer] Rendered ${puzzle.pieces.length} piece containers.`);
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
