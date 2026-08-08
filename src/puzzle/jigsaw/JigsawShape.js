/**
 * JigsawShape — Generates normalized Bezier curves for interlocking Tabs and Slots
 */
export class JigsawShape {
  /**
   * Draw Bezier curve path onto Pixi Graphics or Canvas2D context
   * @param {object} ctx Canvas 2D or Pixi Graphics context
   * @param {number} x1 Start X
   * @param {number} y1 Start Y
   * @param {number} x2 End X
   * @param {number} y2 End Y
   * @param {number} tabType 0 = Flat border, 1 = Tab (outward), -1 = Slot (inward)
   * @param {number} tabSize Relative size of tab protrusion
   */
  static drawEdge(ctx, x1, y1, x2, y2, tabType, tabSize = 0.2) {
    if (tabType === 0) {
      ctx.lineTo(x2, y2);
      return;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Unit vector along edge
    const ux = dx / length;
    const uy = dy / length;

    // Normal vector perpendicular to edge (pointing outward for tabType = 1)
    const nx = -uy * tabType;
    const ny = ux * tabType;

    const p = (fraction, normalOffset) => ({
      x: x1 + ux * length * fraction + nx * length * tabSize * normalOffset,
      y: y1 + uy * length * fraction + ny * length * tabSize * normalOffset
    });

    // Anchor points along edge for classical jigsaw tab shape
    const p1 = p(0.35, 0.0);
    const c1 = p(0.35, 0.15);
    const c2 = p(0.38, 0.5);
    const top1 = p(0.42, 0.7);
    const top2 = p(0.58, 0.7);
    const c3 = p(0.62, 0.5);
    const c4 = p(0.65, 0.15);
    const p2 = p(0.65, 0.0);

    ctx.lineTo(p1.x, p1.y);
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, top1.x, top1.y);
    ctx.lineTo(top2.x, top2.y);
    ctx.bezierCurveTo(c3.x, c3.y, c4.x, c4.y, p2.x, p2.y);
    ctx.lineTo(x2, y2);
  }
}
