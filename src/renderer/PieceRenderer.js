import { Container, Sprite, Texture, Graphics, Rectangle } from 'pixi.js';

/**
 * PieceRenderer — Visual rendering for Normal & Jigsaw pieces using PixiJS Sprites
 */
export class PieceRenderer {
  /**
   * Create Pixi Container containing texture sprite & border outline
   */
  static createPieceSprite(piece, baseTexture, mode = 'normal') {
    const container = new Container();
    container.eventMode = 'static';
    container.cursor = 'grab';

    // Position container at piece grid location
    container.x = piece.x;
    container.y = piece.y;

    const cols = piece.gridCols || 4;
    const rows = piece.gridRows || 4;

    const frameW = baseTexture.width / cols;
    const frameH = baseTexture.height / rows;
    const frameX = piece.col * frameW;
    const frameY = piece.row * frameH;

    // Crop texture frame from source image
    const croppedTexture = new Texture({
      source: baseTexture.source,
      frame: new Rectangle(frameX, frameY, frameW, frameH)
    });

    const sprite = new Sprite(croppedTexture);
    sprite.width = piece.width;
    sprite.height = piece.height;
    container.addChild(sprite);

    // Hairline border outline for clear tile separation
    const border = new Graphics();
    border.rect(0, 0, piece.width, piece.height);
    border.stroke({ width: 1, color: 0xffffff, alpha: 0.3 });
    container.addChild(border);

    container.pieceData = piece;
    return container;
  }
}
