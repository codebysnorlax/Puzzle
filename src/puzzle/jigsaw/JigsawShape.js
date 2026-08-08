/**
 * JigsawShape — Generates organic multi-control-point Bezier curves for varied Tabs, Slots, and Edge/Corner pieces
 */
export class JigsawShape {
  /**
   * Draw organic Bezier curve path onto Pixi Graphics or Canvas2D context
   * @param {object} ctx Canvas 2D or Pixi Graphics context
   * @param {number} x1 Start X
   * @param {number} y1 Start Y
   * @param {number} x2 End X
   * @param {number} y2 End Y
   * @param {object|number} edgeData Edge configuration object or simple tabType number
   */
  static drawEdge(ctx, x1, y1, x2, y2, edgeData) {
    // If edge is a number or flat outer border (0)
    let tabType = 0;
    let tabSize = 0.22;
    let tabPos = 0.5;
    let neckW = 0.09;
    let headW = 0.20;
    let curveB = 0;

    if (typeof edgeData === 'number') {
      tabType = edgeData;
    } else if (edgeData && typeof edgeData === 'object') {
      tabType = edgeData.tabType !== undefined ? edgeData.tabType : 0;
      tabSize = edgeData.tabSize || 0.22;
      tabPos = edgeData.tabPos || 0.5;
      neckW = edgeData.neckWidth || 0.09;
      headW = edgeData.headWidth || 0.20;
      curveB = edgeData.curveBias || 0;
    }

    // Flat outer border edge (Corner or Edge outer boundary)
    if (tabType === 0) {
      ctx.lineTo(x2, y2);
      return;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;

    // Unit vector along edge
    const ux = dx / length;
    const uy = dy / length;

    // Normal vector perpendicular to edge (pointing outward for tabType = 1, inward for -1)
    const nx = -uy * tabType;
    const ny = ux * tabType;

    // Helper function to calculate absolute canvas coordinates
    const p = (uFrac, nOffset) => ({
      x: x1 + ux * length * uFrac + nx * length * tabSize * nOffset,
      y: y1 + uy * length * uFrac + ny * length * tabSize * nOffset
    });

    // Calculate tab key points along edge
    const neckBaseStart = Math.max(0.12, tabPos - headW / 2);
    const neckBaseEnd = Math.min(0.88, tabPos + headW / 2);
    const headStart = tabPos - neckW / 2;
    const headEnd = tabPos + neckW / 2;

    // Control points for organic curve
    const midBase1 = p(neckBaseStart * 0.5, curveB * 0.4);
    const startBase = p(neckBaseStart, 0.0);

    // Bulbous Tab head control points
    const neckControlLeft = p(neckBaseStart, 0.15);
    const headControlLeft = p(headStart - 0.02, 0.60);
    const headTopLeft = p(headStart + 0.01, 0.96);

    const headTopRight = p(headEnd - 0.01, 0.96);
    const headControlRight = p(headEnd + 0.02, 0.60);
    const neckControlRight = p(neckBaseEnd, 0.15);
    const endBase = p(neckBaseEnd, 0.0);

    // Baseline curve after tab
    const midBase2 = p(1 - (1 - neckBaseEnd) * 0.5, -curveB * 0.4);

    // 1. Organic baseline curve to tab start
    ctx.quadraticCurveTo(midBase1.x, midBase1.y, startBase.x, startBase.y);

    // 2. Bezier curve up into bulbous tab head
    ctx.bezierCurveTo(
      neckControlLeft.x, neckControlLeft.y,
      headControlLeft.x, headControlLeft.y,
      headTopLeft.x, headTopLeft.y
    );

    // 3. Smooth line across top of tab head
    ctx.lineTo(headTopRight.x, headTopRight.y);

    // 4. Bezier curve down back to baseline
    ctx.bezierCurveTo(
      headControlRight.x, headControlRight.y,
      neckControlRight.x, neckControlRight.y,
      endBase.x, endBase.y
    );

    // 5. Organic baseline curve to end corner
    ctx.quadraticCurveTo(midBase2.x, midBase2.y, x2, y2);
  }
}
