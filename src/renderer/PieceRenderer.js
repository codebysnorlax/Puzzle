import { Container, Sprite, Texture, Graphics, Rectangle } from 'pixi.js';
import { JigsawShape } from '../puzzle/jigsaw/JigsawShape.js';

/**
 * PieceRenderer — Visual rendering for Normal & Jigsaw pieces using PixiJS Sprites and Masks
 */
export class PieceRenderer {
  /**
   * Create Pixi Container containing texture sprite, border outline, and mask
   */
  static createPieceSprite(piece, baseTexture, mode = 'normal') {
    const container = new Container();
    container.eventMode = 'static';
    container.cursor = 'grab';

    // Set initial position
    container.x = piece.x;
    container.y = piece.y;

    if (mode === 'normal') {
      // 1. Crop frame from baseTexture
      const frame = new Rectangle(
        (piece.col * baseTexture.width) / (piece.width > 0 ? (baseTexture.width / piece.width) : 1),
        (piece.row * baseTexture.height) / (piece.height > 0 ? (baseTexture.height / piece.height) : 1),
        baseTexture.width / (baseTexture.width / piece.width),
        baseTexture.height / (baseTexture.height / piece.height)
      );

      // Frame texture derived from scaled source texture
      const croppedTexture = new Texture({
        source: baseTexture.source,
        frame: new Rectangle(
          piece.col * (baseTexture.width / (baseTexture.width / piece.width)),
          piece.row * (baseTexture.height / (baseTexture.height / piece.height)),
          piece.width,
          piece.height
        )
      });

      const sprite = new Sprite(croppedTexture);
      sprite.width = piece.width;
      sprite.height = piece.height;
      container.addChild(sprite);

      // Subtle border stroke
      const border = new Graphics();
      border.rect(0, 0, piece.width, piece.height);
      border.stroke({ width: 1, color: 0xffffff, alpha: 0.3 });
      container.addChild(border);

    } else {
      // Jigsaw Mode with Bezier Masking
      const mask = new Graphics();
      mask.beginPath();
      mask.moveTo(0, 0);

      // Top Edge
      JigsawShape.drawEdge(mask, 0, 0, piece.width, 0, piece.edges.top);
      // Right Edge
      JigsawShape.drawEdge(mask, piece.width, 0, piece.width, piece.height, piece.edges.right);
      // Bottom Edge
      JigsawShape.drawEdge(mask, piece.width, piece.height, 0, piece.height, piece.edges.bottom);
      // Left Edge
      JigsawShape.drawEdge(mask, 0, piece.height, 0, 0, piece.edges.left);

      mask.closePath();
      mask.fill({ color: 0xffffff });

      // Crop texture sprite
      const croppedTexture = new Texture({
        source: baseTexture.source,
        frame: new Rectangle(
          piece.col * piece.width,
          piece.row * piece.height,
          piece.width,
          piece.height
        )
      });

      const sprite = new Sprite(croppedTexture);
      sprite.width = piece.width;
      sprite.height = piece.height;
      sprite.mask = mask;

      container.addChild(mask);
      container.addChild(sprite);

      // Draw matching border outline
      const border = new Graphics();
      border.beginPath();
      border.moveTo(0, 0);
      JigsawShape.drawEdge(border, 0, 0, piece.width, 0, piece.edges.top);
      JigsawShape.drawEdge(border, piece.width, 0, piece.width, piece.height, piece.edges.right);
      JigsawShape.drawEdge(border, piece.width, piece.height, 0, piece.height, piece.edges.bottom);
      JigsawShape.drawEdge(border, 0, piece.height, 0, 0, piece.edges.left);
      border.closePath();
      border.stroke({ width: 2, color: 0xffffff, alpha: 0.4 });
      container.addChild(border);
    }

    container.pieceData = piece;
    return container;
  }
}
