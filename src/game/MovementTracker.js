/**
 * MovementTracker — Tracks pointer moves and cumulative drag distance
 */
export class MovementTracker {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.moveCount = 0;
    this.totalDistance = 0; // Cumulative distance in pixels
    this.hasMovedMeaningfully = false;
    this.threshold = 5; // Pixels
  }

  recordDragStart(x, y) {
    this.lastX = x;
    this.lastY = y;
  }

  recordDragMove(x, y) {
    if (this.lastX === undefined || this.lastY === undefined) {
      this.lastX = x;
      this.lastY = y;
      return 0;
    }

    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.totalDistance += dist;
    this.lastX = x;
    this.lastY = y;

    if (!this.hasMovedMeaningfully && this.totalDistance >= this.threshold) {
      this.hasMovedMeaningfully = true;
    }

    if (this.onUpdate) {
      this.onUpdate({
        moveCount: this.moveCount,
        totalDistance: Math.round(this.totalDistance),
        hasMovedMeaningfully: this.hasMovedMeaningfully
      });
    }

    return dist;
  }

  recordDragEnd() {
    this.moveCount += 1;
    this.lastX = undefined;
    this.lastY = undefined;

    if (this.onUpdate) {
      this.onUpdate({
        moveCount: this.moveCount,
        totalDistance: Math.round(this.totalDistance),
        hasMovedMeaningfully: this.hasMovedMeaningfully
      });
    }
  }

  reset() {
    this.moveCount = 0;
    this.totalDistance = 0;
    this.hasMovedMeaningfully = false;
    this.lastX = undefined;
    this.lastY = undefined;

    if (this.onUpdate) {
      this.onUpdate({
        moveCount: 0,
        totalDistance: 0,
        hasMovedMeaningfully: false
      });
    }
  }
}
