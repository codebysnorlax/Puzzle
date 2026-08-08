/**
 * Piece — Pure data model for an individual puzzle piece
 * Maintains strict separation between Correct State and Current State
 */
export class Piece {
  constructor({
    id,
    index,
    row,
    col,
    correctX,
    correctY,
    correctRotation = 0,
    width,
    height
  }) {
    this.id = id;
    this.index = index;
    this.row = row;
    this.col = col;

    // IMMUTABLE CORRECT TARGET STATE
    this.correctX = correctX;
    this.correctY = correctY;
    this.correctRotation = correctRotation;
    this.width = width;
    this.height = height;

    // MUTABLE ACTIVE CURRENT STATE
    this.x = correctX;
    this.y = correctY;
    this.rotation = 0;

    // STATUS FLAGS
    this.placed = false;
    this.locked = false;
    this.groupId = null; // Used in Jigsaw mode for connected piece groups
  }

  /**
   * Set active canvas coordinates without modifying correct target coordinates
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Snap piece to exact correct target position and lock
   */
  snapToCorrect() {
    this.x = this.correctX;
    this.y = this.correctY;
    this.rotation = this.correctRotation;
    this.placed = true;
    this.locked = true;
  }
}
