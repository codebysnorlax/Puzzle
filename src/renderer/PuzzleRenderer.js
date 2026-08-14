import { Container, Graphics, Texture, Sprite } from 'pixi.js';
import { SettingsStore } from '../storage/SettingsStore.js';
import { PieceRenderer } from './PieceRenderer.js';
import { SoundEffects } from '../game/SoundEffects.js';

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

      // If the completion animation was active, re-add/resume it!
      if (this.borderEffect && !this.borderEffect.destroyed) {
        this.boardContainer.addChild(this.borderEffect);
      }
    }
  }

  updatePieceBorders() {
    const settings = SettingsStore.getSettings();
    const chosenColor = settings.borderColor || '#64748b';

    this.pieceSpritesMap.forEach((spriteContainer) => {
      const border = spriteContainer.borderGraphic;
      const piece = spriteContainer.pieceData;
      if (border && piece) {
        border.clear();
        border.rect(0, 0, piece.width, piece.height);
        border.stroke({ width: 1.5, color: chosenColor, alpha: 0.6 });
      }
    });

    if (this.pixiApp && this.pixiApp.app && this.pixiApp.app.renderer) {
      this.pixiApp.app.renderer.render(this.stage);
    }
  }

  highlightAllIncorrectPieces(pieceIds) {
    const settings = SettingsStore.getSettings();
    const chosenColor = settings.borderColor || '#64748b';

    const targets = [];
    pieceIds.forEach(id => {
      const container = this.pieceSpritesMap.get(id);
      if (container && container.borderGraphic && container.pieceData) {
        targets.push(container);
      }
    });

    if (targets.length === 0) return;

    let startTime = null;
    const duration = 3500; // 3.5s total animation duration

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Cycle progress for 500ms per cycle (7 blinks over 3.5s)
      const cycleProgress = (elapsed % 500) / 500;
      const redAlpha = 0.1 + 0.9 * Math.sin(cycleProgress * Math.PI); // Pulse alpha smoothly between 0.1 and 1.0

      targets.forEach(container => {
        if (container.destroyed) return;

        const border = container.borderGraphic;
        const piece = container.pieceData;
        if (border && !border.destroyed && piece) {
          border.clear();
          border.rect(0, 0, piece.width, piece.height);
          
          // Pure red border blinking clearly
          border.stroke({ width: 3.0, color: 0xef4444, alpha: redAlpha });
        }
      });

      if (this.pixiApp && this.pixiApp.app && this.pixiApp.app.renderer) {
        this.pixiApp.app.renderer.render(this.stage);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Revert all pieces back to normal state
        targets.forEach(container => {
          if (container.destroyed) return;
          const border = container.borderGraphic;
          const piece = container.pieceData;
          if (border && !border.destroyed && piece) {
            border.clear();
            border.rect(0, 0, piece.width, piece.height);
            border.stroke({ width: 1.5, color: chosenColor, alpha: 0.6 });
          }
        });
        if (this.pixiApp && this.pixiApp.app && this.pixiApp.app.renderer) {
          this.pixiApp.app.renderer.render(this.stage);
        }
      }
    };
    requestAnimationFrame(animate);
  }

  playWaveLockingAnimation(onComplete) {
    const settings = SettingsStore.getSettings();
    const chosenColor = settings.borderColor || '#64748b';

    const pieces = Array.from(this.pieceSpritesMap.values());
    let maxDelay = 0;

    pieces.forEach((spriteContainer) => {
      const piece = spriteContainer.pieceData;
      if (!piece) return;

      const distance = piece.row + piece.col;
      const delay = distance * 100; // 100ms propagation step
      if (delay > maxDelay) {
        maxDelay = delay;
      }

      setTimeout(() => {
        if (spriteContainer.destroyed) return;

        // Play snappy lock sound
        SoundEffects.playMoveSound();

        const border = spriteContainer.borderGraphic;
        if (border) {
          border.clear();
          border.rect(0, 0, piece.width, piece.height);
          border.stroke({ width: 2.5, color: 0xffffff, alpha: 1.0 }); // Flash white border
        }

        // Snappy scale animation
        let startTime = null;
        const duration = 250; // ms

        const animate = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(1, elapsed / duration);

          let scale = 1;
          if (progress < 0.5) {
            scale = 1 + (progress / 0.5) * 0.12;
          } else {
            scale = 1.12 - ((progress - 0.5) / 0.5) * 0.12;
          }

          spriteContainer.scale.set(scale);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            spriteContainer.scale.set(1.0);
            if (border && !border.destroyed) {
              border.clear();
              border.rect(0, 0, piece.width, piece.height);
              border.stroke({ width: 1.5, color: chosenColor, alpha: 0.6 });
            }
          }
        };
        requestAnimationFrame(animate);
      }, delay);
    });

    setTimeout(() => {
      if (onComplete) onComplete();
    }, maxDelay + 400);
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
    this.stopCompletionAnimation();

    const borderEffect = new Graphics();
    this.boardContainer.addChild(borderEffect);
    this.borderEffect = borderEffect;

    let phase = 0;
    this.tickerCallback = () => {
      phase += 0.005; // Smooth crawling speed
      borderEffect.clear();

      const rx = boardLayout.x - 4;
      const ry = boardLayout.y - 4;
      const rw = boardLayout.width + 8;
      const rh = boardLayout.height + 8;
      const P = 2 * (rw + rh);
      const wormLength = P * 0.18; // 18% of perimeter
      const N = 20; // Segments per comet for smooth fading tail

      const colors = [0x4285f4, 0xea4335, 0xfbbc05, 0x34a853]; // Google colors (Blue, Red, Yellow, Green)

      // Helper function to resolve coordinate along rectangle perimeter
      const getPointOnRect = (x, y, w, h, d) => {
        d = ((d % P) + P) % P;
        if (d <= w) {
          return { x: x + d, y: y };
        } else if (d <= w + h) {
          return { x: x + w, y: y + (d - w) };
        } else if (d <= 2 * w + h) {
          return { x: x + w - (d - (w + h)), y: y + h };
        } else {
          return { x: x, y: y + h - (d - (2 * w + h)) };
        }
      };

      // Draw comets with fading tails and a pulsing outer glow
      const glowPulseWidth = 14 + 4 * Math.sin(phase * 18);

      for (let i = 0; i < colors.length; i++) {
        const startD = phase * P + (i * 0.25 * P);
        const color = colors[i];

        // Render comets segment by segment for a smooth fading alpha tail
        for (let j = 1; j <= N; j++) {
          const dPrev = startD + ((j - 1) / N) * wormLength;
          const dCurr = startD + (j / N) * wormLength;
          const pPrev = getPointOnRect(rx, ry, rw, rh, dPrev);
          const pCurr = getPointOnRect(rx, ry, rw, rh, dCurr);

          const ratio = j / N; // 0 to 1 (tail to head)

          borderEffect.beginPath();
          borderEffect.moveTo(pPrev.x, pPrev.y);
          borderEffect.lineTo(pCurr.x, pCurr.y);

          // 1. Thick pulsing outer glow
          borderEffect.stroke({
            width: glowPulseWidth,
            color: color,
            alpha: 0.22 * ratio,
            cap: 'round',
            join: 'round'
          });

          // 2. Solid core
          borderEffect.stroke({
            width: 3.5,
            color: color,
            alpha: 1.0 * ratio,
            cap: 'round',
            join: 'round'
          });
        }
      }
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

  stopCompletionAnimation() {
    if (this.tickerCallback && this.pixiApp && this.pixiApp.app) {
      this.pixiApp.app.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
    if (this.borderEffect) {
      this.boardContainer.removeChild(this.borderEffect);
      this.borderEffect.destroy();
      this.borderEffect = null;
    }
  }

  clear() {
    this.stopCompletionAnimation();
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }
    this.piecesContainer.removeChildren();
    this.boardContainer.removeChildren();
    this.pieceSpritesMap.clear();
    this.hintSprite = null;
  }
}
