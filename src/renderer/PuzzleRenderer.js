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
   * Render dark or light anti-cheat board target slot backdrop with subtle slot guidelines
   */
  renderBoardTarget(boardLayout, mode = 'normal', cols = 4, rows = 4) {
    this.lastBoardLayout = boardLayout;
    this.lastMode = mode;
    this.lastCols = cols;
    this.lastRows = rows;

    this.boardContainer.removeChildren();

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    const shadow = new Graphics();
    shadow.roundRect(boardLayout.x + 4, boardLayout.y + 4, boardLayout.width, boardLayout.height, 10);
    shadow.fill({ color: 0x000000, alpha: isLight ? 0.08 : 0.45 });

    // Anti-cheat surface backdrop adapting to Light/Dark theme
    const boardBackdrop = new Graphics();
    boardBackdrop.roundRect(boardLayout.x, boardLayout.y, boardLayout.width, boardLayout.height, 10);
    boardBackdrop.fill({ color: isLight ? 0xffffff : 0x111827, alpha: 0.95 });
    boardBackdrop.stroke({ width: 2, color: isLight ? 0xc0ccda : 0x374151, alpha: 0.8 });

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
    gridLines.stroke({ width: 1, color: isLight ? 0x64748b : 0xffffff, alpha: isLight ? 0.35 : 0.08 });

    this.boardContainer.addChild(shadow);
    this.boardContainer.addChild(boardBackdrop);
    this.boardContainer.addChild(gridLines);
  }

  updateTheme(theme, puzzle = null) {
    if (this.lastBoardLayout) {
      const cols = puzzle ? puzzle.cols : (this.lastCols || 4);
      const rows = puzzle ? puzzle.rows : (this.lastRows || 4);
      const layout = puzzle ? puzzle.boardLayout : this.lastBoardLayout;
      this.renderBoardTarget(layout, this.lastMode || 'normal', cols, rows);
    }
  }

  /**
   * Load base Pixi Texture from image HTMLCanvasElement and instantiate all piece sprites
   */
  async renderPuzzle(puzzle, imageCanvas, mode = 'normal') {
    this.clear();
    this.renderBoardTarget(puzzle.boardLayout, mode, puzzle.cols, puzzle.rows);

    let baseTexture;
    try {
      baseTexture = Texture.from(imageCanvas);
      if (baseTexture && baseTexture.source && typeof baseTexture.source.update === 'function') {
        baseTexture.source.update();
      }
    } catch (e) {
      console.warn('[PuzzleRenderer] Texture creation fallback warning:', e);
      baseTexture = Texture.from(imageCanvas);
    }

    puzzle.pieces.forEach((piece) => {
      const spriteContainer = PieceRenderer.createPieceSprite(
        piece,
        baseTexture,
        imageCanvas,
        mode,
        puzzle.cols,
        puzzle.rows
      );
      this.piecesContainer.addChild(spriteContainer);
      this.pieceSpritesMap.set(piece.id, spriteContainer);
    });

    // Force PixiJS Application stage render for immediate presentation
    if (this.pixiApp && this.pixiApp.app && this.pixiApp.app.renderer) {
      this.pixiApp.app.renderer.render(this.stage);
    }
  }

  showTemporaryHint(imageCanvas, boardLayout, durationMs = 2200) {
    if (this.hintSprite) {
      this.boardContainer.removeChild(this.hintSprite);
      this.hintSprite.destroy();
      this.hintSprite = null;
    }
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }

    try {
      const texture = Texture.from(imageCanvas);
      const hint = new Sprite(texture);
      hint.x = boardLayout.x;
      hint.y = boardLayout.y;
      hint.width = boardLayout.width;
      hint.height = boardLayout.height;
      hint.alpha = 0.35;

      this.boardContainer.addChild(hint);
      this.hintSprite = hint;

      if (this.pixiApp && this.pixiApp.app && this.pixiApp.app.renderer) {
        this.pixiApp.app.renderer.render(this.stage);
      }

      this.hintTimeout = setTimeout(() => {
        if (this.hintSprite) {
          this.boardContainer.removeChild(this.hintSprite);
          this.hintSprite.destroy();
          this.hintSprite = null;
          if (this.pixiApp && this.pixiApp.app && this.pixiApp.app.renderer) {
            this.pixiApp.app.renderer.render(this.stage);
          }
        }
      }, durationMs);
    } catch (e) {
      console.warn('[PuzzleRenderer] Hint overlay rendering warning:', e);
    }
  }

  playCompletionAnimation(boardLayout) {
    const borderEffect = new Graphics();
    this.boardContainer.addChild(borderEffect);

    let phase = 0;
    this.tickerCallback = () => {
      phase += 0.08;
      borderEffect.clear();
      borderEffect.roundRect(
        boardLayout.x - 4,
        boardLayout.y - 4,
        boardLayout.width + 8,
        boardLayout.height + 8,
        14
      );
      const alphaPulse = 0.4 + Math.sin(phase) * 0.4;
      borderEffect.stroke({ width: 4, color: 0x10b981, alpha: alphaPulse });
    };

    if (this.pixiApp && this.pixiApp.app) {
      this.pixiApp.app.ticker.add(this.tickerCallback);
    }
  }

  resize(puzzle, imageCanvas, mode = 'normal') {
    this.renderPuzzle(puzzle, imageCanvas, mode);
  }

  /**
   * Sync piece data positions to their sprite containers on screen.
   * Called on every pointer move during drag — must be fast.
   */
  updatePiecePositions(pieces) {
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      const sprite = this.pieceSpritesMap.get(piece.id);
      if (sprite) {
        sprite.x = piece.x;
        sprite.y = piece.y;
      }
    }
  }

  getSpriteForPiece(piece) {
    return this.pieceSpritesMap.get(piece.id);
  }

  clear() {
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }
    if (this.tickerCallback && this.pixiApp && this.pixiApp.app) {
      this.pixiApp.app.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
    this.piecesContainer.removeChildren();
    this.boardContainer.removeChildren();
    this.pieceSpritesMap.clear();
    this.hintSprite = null;
  }
}
