import { Container, Graphics, Texture, Sprite } from 'pixi.js';
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
    this.tickerCallback = null;
    this.hintSprite = null;
    this.hintTimeout = null;
  }

  /**
   * Render dark anti-cheat board target slot backdrop with subtle slot guidelines
   */
  renderBoardTarget(boardLayout, mode = 'normal', cols = 4, rows = 4) {
    this.boardContainer.removeChildren();

    const shadow = new Graphics();
    shadow.roundRect(boardLayout.x + 4, boardLayout.y + 4, boardLayout.width, boardLayout.height, 10);
    shadow.fill({ color: 0x000000, alpha: 0.45 });

    // Anti-cheat dark surface backdrop
    const boardBackdrop = new Graphics();
    boardBackdrop.roundRect(boardLayout.x, boardLayout.y, boardLayout.width, boardLayout.height, 10);
    boardBackdrop.fill({ color: 0x111827, alpha: 0.95 });
    boardBackdrop.stroke({ width: 2, color: 0x374151, alpha: 0.8 });

    // Subtle slot grid guidelines
    const gridLines = new Graphics();
    const cellW = boardLayout.width / cols;
    const cellH = boardLayout.height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        gridLines.rect(
          boardLayout.x + c * cellW,
          boardLayout.y + r * cellH,
          cellW,
          cellH
        );
      }
    }
    gridLines.stroke({ width: 1, color: 0xffffff, alpha: 0.08 });

    this.boardContainer.addChild(shadow);
    this.boardContainer.addChild(boardBackdrop);
    this.boardContainer.addChild(gridLines);
  }

  /**
   * Load base Pixi Texture from image HTMLCanvasElement and instantiate all piece sprites
   */
  async renderPuzzle(puzzle, imageCanvas, mode = 'normal') {
    this.clear();
    this.renderBoardTarget(puzzle.boardLayout, mode, puzzle.cols, puzzle.rows);

    const baseTexture = Texture.from(imageCanvas);

    puzzle.pieces.forEach(piece => {
      const spriteContainer = PieceRenderer.createPieceSprite(
        piece,
        baseTexture,
        mode,
        puzzle.cols,
        puzzle.rows
      );
      this.piecesContainer.addChild(spriteContainer);
      this.pieceSpritesMap.set(piece.id, spriteContainer);
    });
  }

  /**
   * Temporarily display a subtle 28% translucent reference hint overlay over board target for durationMs
   */
  showTemporaryHint(imageCanvas, boardLayout, durationMs = 2200) {
    if (this.hintSprite) {
      this.boardContainer.removeChild(this.hintSprite);
      this.hintSprite.destroy();
      this.hintSprite = null;
    }

    const hintTexture = Texture.from(imageCanvas);
    this.hintSprite = new Sprite(hintTexture);
    this.hintSprite.x = boardLayout.x;
    this.hintSprite.y = boardLayout.y;
    this.hintSprite.width = boardLayout.width;
    this.hintSprite.height = boardLayout.height;
    this.hintSprite.alpha = 0.28; // Subtle 28% alpha hint peek overlay

    this.boardContainer.addChild(this.hintSprite);

    if (this.hintTimeout) clearTimeout(this.hintTimeout);
    this.hintTimeout = setTimeout(() => {
      if (this.hintSprite) {
        this.boardContainer.removeChild(this.hintSprite);
        this.hintSprite.destroy();
        this.hintSprite = null;
      }
    }, durationMs);
  }

  /**
   * Play pulsing victory border animation around completed puzzle
   */
  playCompletionAnimation(boardLayout) {
    const victoryGlow = new Graphics();
    this.boardContainer.addChild(victoryGlow);

    let alpha = 0.4;
    let growing = true;

    this.tickerCallback = () => {
      if (growing) {
        alpha += 0.02;
        if (alpha >= 1.0) growing = false;
      } else {
        alpha -= 0.02;
        if (alpha <= 0.3) growing = true;
      }

      victoryGlow.clear();
      victoryGlow.roundRect(
        boardLayout.x - 3,
        boardLayout.y - 3,
        boardLayout.width + 6,
        boardLayout.height + 6,
        10
      );
      victoryGlow.stroke({ width: 4, color: 0x10b981, alpha: alpha });
    };

    this.pixiApp.app.ticker.add(this.tickerCallback);
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
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }
    if (this.tickerCallback) {
      this.pixiApp.app.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
    this.piecesContainer.removeChildren();
    this.boardContainer.removeChildren();
    this.pieceSpritesMap.clear();
    this.hintSprite = null;
  }
}
