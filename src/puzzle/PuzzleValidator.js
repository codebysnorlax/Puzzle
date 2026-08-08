/**
 * PuzzleValidator — Pure mathematical grid placement completion validation
 */
export class PuzzleValidator {
  /**
   * Check if piece is in its exact correct grid position
   * @param {Piece} piece 
   * @returns {boolean}
   */
  static isPieceInCorrectSlot(piece) {
    if (!piece) return false;
    return Math.abs(piece.x - piece.correctX) < 2 && Math.abs(piece.y - piece.correctY) < 2;
  }

  /**
   * Validate entire puzzle completion
   * Puzzle is complete if and only if every piece occupies its matching correct grid slot
   * @param {Array<Piece>} pieces 
   * @returns {boolean}
   */
  static isPuzzleComplete(pieces) {
    if (!pieces || pieces.length === 0) return false;
    return pieces.every(p => this.isPieceInCorrectSlot(p));
  }
}
