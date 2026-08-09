import { Container, Sprite, Texture, Graphics, Rectangle } from 'pixi.js';

/**
 * PieceRenderer — Visual rendering for Normal & Organic Jigsaw pieces using PixiJS Sprites & Unclipped Bezier Masks
 */
export class PieceRenderer {
  /**
   * Create Pixi Container containing texture sprite & border outline
   */
  static createPieceSprite(piece, baseTexture, imageCanvas, mode = 'normal', gridCols = 4, gridRows = 4) {
    const container = new Container();
    container.eventMode = 'static';
    container.cursor = 'grab';
    container.visible = true;
    container.alpha = 1;

    // Position container at piece grid location
    container.x = piece.x;
    container.y = piece.y;

    const cols = piece.gridCols || gridCols || 4;
    const rows = piece.gridRows || gridRows || 4;

    // Use exact canvas dimensions to prevent 0-width frame calculations
    const canvasW = (imageCanvas && imageCanvas.width) || baseTexture.width || 800;
    const canvasH = (imageCanvas && imageCanvas.height) || baseTexture.height || 600;

    const frameW = canvasW / cols;
    const frameH = canvasH / rows;

    const origFrameX = Math.min(canvasW - frameW, piece.col * frameW);
    const origFrameY = Math.min(canvasH - frameH, piece.row * frameH);

    // 0. Base dark slate background tile graphic ensuring piece tile is 100% visible
    const bgTile = new Graphics();
    bgTile.roundRect(0, 0, piece.width, piece.height, 4);
    bgTile.fill({ color: 0x1e293b, alpha: 0.95 });
    container.addChild(bgTile);

    // Normal Mode — Rectangular Tile
    const croppedTexture = new Texture({
      source: baseTexture.source,
      frame: new Rectangle(origFrameX, origFrameY, frameW, frameH)
    });

    if (croppedTexture.source) {
      croppedTexture.source.update();
    }

    const sprite = new Sprite(croppedTexture);
    sprite.width = piece.width;
    sprite.height = piece.height;
    sprite.visible = true;
    sprite.alpha = 1;
    container.addChild(sprite);

    const border = new Graphics();
    border.roundRect(0, 0, piece.width, piece.height, 4);
    border.stroke({ width: 1.5, color: 0x38bdf8, alpha: 0.6 });
    container.addChild(border);

    container.pieceData = piece;
    return container;
  }
}
