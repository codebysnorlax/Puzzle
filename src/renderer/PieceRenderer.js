import { Container, Sprite, Texture, Graphics, Rectangle } from 'pixi.js';
import { JigsawShape } from '../puzzle/jigsaw/JigsawShape.js';

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

    if (mode === 'normal') {
      // 1. Normal Mode — Rectangular Tile
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

    } else {
      // 2. Jigsaw Mode — Organic Bezier Interlocking Mask & Margin-Expanded Unclipped Texture
      const marginW = Math.round(piece.width * 0.35);
      const marginH = Math.round(piece.height * 0.35);

      const cropX = Math.max(0, origFrameX - marginW);
      const cropY = Math.max(0, origFrameY - marginH);
      const cropW = Math.min(canvasW - cropX, frameW + marginW * 2);
      const cropH = Math.min(canvasH - cropY, frameH + marginH * 2);

      const expandedTexture = new Texture({
        source: baseTexture.source,
        frame: new Rectangle(cropX, cropY, cropW, cropH)
      });

      if (expandedTexture.source) {
        expandedTexture.source.update();
      }

      const sprite = new Sprite(expandedTexture);
      const scaleX = piece.width / frameW;
      const scaleY = piece.height / frameH;

      sprite.scale.set(scaleX, scaleY);

      // Offset sprite so original frame (col * frameW, row * frameH) maps to container origin (0, 0)
      const offsetX = (origFrameX - cropX) * scaleX;
      const offsetY = (origFrameY - cropY) * scaleY;
      sprite.x = -offsetX;
      sprite.y = -offsetY;
      sprite.visible = true;
      sprite.alpha = 1;

      // Bezier Curve Mask
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

      sprite.mask = mask;

      container.addChild(mask);
      container.addChild(sprite);

      // Draw matching organic Bezier stroke outline
      const border = new Graphics();
      border.beginPath();
      border.moveTo(0, 0);
      JigsawShape.drawEdge(border, 0, 0, piece.width, 0, topEdge);
      JigsawShape.drawEdge(border, piece.width, 0, piece.width, piece.height, rightEdge);
      JigsawShape.drawEdge(border, piece.width, piece.height, 0, piece.height, bottomEdge);
      JigsawShape.drawEdge(border, 0, piece.height, 0, 0, leftEdge);
      border.closePath();
      border.stroke({ width: 1.8, color: 0x38bdf8, alpha: 0.7 });
      container.addChild(border);
    }

    container.pieceData = piece;
    return container;
  }
}
