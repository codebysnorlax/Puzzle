import { Container, Sprite, Texture, Graphics, Rectangle } from 'pixi.js';
import { JigsawShape } from '../puzzle/jigsaw/JigsawShape.js';

/**
 * PieceRenderer — Visual rendering for Normal & Jigsaw pieces using PixiJS Sprites and Bezier Masks
 */
export class PieceRenderer {
  /**
   * Create Pixi Container containing texture sprite & border outline
   */
  static createPieceSprite(piece, baseTexture, mode = 'normal', gridCols = 4, gridRows = 4) {
    const container = new Container();
    container.eventMode = 'static';
    container.cursor = 'grab';

    // Position container at piece grid location
    container.x = piece.x;
    container.y = piece.y;

    const cols = piece.gridCols || gridCols || 4;
    const rows = piece.gridRows || gridRows || 4;

    const frameW = baseTexture.width / cols;
    const frameH = baseTexture.height / rows;

    // Safely clamp frame bounds to prevent boundary clipping
    const frameX = Math.min(baseTexture.width - frameW, piece.col * frameW);
    const frameY = Math.min(baseTexture.height - frameH, piece.row * frameH);

    const croppedTexture = new Texture({
      source: baseTexture.source,
      frame: new Rectangle(frameX, frameY, frameW, frameH)
    });

    if (mode === 'normal') {
      // 1. Normal Mode — Rectangular Tile
      const sprite = new Sprite(croppedTexture);
      sprite.width = piece.width;
      sprite.height = piece.height;
      container.addChild(sprite);

      const border = new Graphics();
      border.rect(0, 0, piece.width, piece.height);
      border.stroke({ width: 1, color: 0xffffff, alpha: 0.35 });
      container.addChild(border);

    } else {
      // 2. Jigsaw Mode — Interlocking Bezier Tab / Slot Masking
      const mask = new Graphics();
      mask.beginPath();
      mask.moveTo(0, 0);

      const topEdge = piece.edges ? piece.edges.top : 0;
      const rightEdge = piece.edges ? piece.edges.right : 0;
      const bottomEdge = piece.edges ? piece.edges.bottom : 0;
      const leftEdge = piece.edges ? piece.edges.left : 0;

      // Top Edge
      JigsawShape.drawEdge(mask, 0, 0, piece.width, 0, topEdge);
      // Right Edge
      JigsawShape.drawEdge(mask, piece.width, 0, piece.width, piece.height, rightEdge);
      // Bottom Edge
      JigsawShape.drawEdge(mask, piece.width, piece.height, 0, piece.height, bottomEdge);
      // Left Edge
      JigsawShape.drawEdge(mask, 0, piece.height, 0, 0, leftEdge);

      mask.closePath();
      mask.fill({ color: 0xffffff });

      const sprite = new Sprite(croppedTexture);
      sprite.width = piece.width;
      sprite.height = piece.height;
      sprite.mask = mask;

      container.addChild(mask);
      container.addChild(sprite);

      // Draw matching Bezier stroke outline
      const border = new Graphics();
      border.beginPath();
      border.moveTo(0, 0);
      JigsawShape.drawEdge(border, 0, 0, piece.width, 0, topEdge);
      JigsawShape.drawEdge(border, piece.width, 0, piece.width, piece.height, rightEdge);
      JigsawShape.drawEdge(border, piece.width, piece.height, 0, piece.height, bottomEdge);
      JigsawShape.drawEdge(border, 0, piece.height, 0, 0, leftEdge);
      border.closePath();
      border.stroke({ width: 1.5, color: 0xffffff, alpha: 0.45 });
      container.addChild(border);
    }

    container.pieceData = piece;
    return container;
  }
}
