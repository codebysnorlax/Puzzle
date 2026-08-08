import { SeededRandom } from './SeededRandom.js';

/**
 * Shuffle — Grid position permutation shuffler for tile-swap gameplay
 */
export class Shuffle {
  /**
   * Permute grid positions among all pieces using Fisher-Yates shuffle on SeededRandom PRNG
   * @param {Array<Piece>} pieces 
   * @param {object} boardLayout 
   * @param {number} viewportWidth 
   * @param {number} viewportHeight 
   * @param {string|number} seed 
   */
  static shufflePieces(pieces, boardLayout, viewportWidth, viewportHeight, seed) {
    if (!pieces || pieces.length === 0) return pieces;

    const rng = new SeededRandom(seed);

    // Extract all valid grid cell target coordinates
    const gridSlots = pieces.map(p => ({
      x: p.correctX,
      y: p.correctY,
      row: p.row,
      col: p.col
    }));

    // Fisher-Yates shuffle algorithm on gridSlots array
    for (let i = gridSlots.length - 1; i > 0; i--) {
      const j = rng.rangeInt(0, i);
      const temp = gridSlots[i];
      gridSlots[i] = gridSlots[j];
      gridSlots[j] = temp;
    }

    // Assign shuffled grid slots to pieces
    pieces.forEach((piece, idx) => {
      const slot = gridSlots[idx];
      piece.setPosition(slot.x, slot.y);
      piece.currentGridRow = slot.row;
      piece.currentGridCol = slot.col;

      const isCorrect = (piece.x === piece.correctX && piece.y === piece.correctY);
      piece.placed = isCorrect;
      piece.locked = isCorrect;
    });

    return pieces;
  }
}
