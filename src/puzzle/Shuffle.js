import { SeededRandom } from './SeededRandom.js';

/**
 * Shuffle — Grid position permutation shuffler for tile-swap gameplay
 * Guarantees that at game start, the puzzle opens 100% scrambled (puzzled, NOT solved)
 */
export class Shuffle {
  /**
   * Permute grid positions among all pieces using Fisher-Yates shuffle with strict derangement
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

    // Guarantee strict derangement: no piece lands on its correct position at start
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      const s = gridSlots[i];
      if (s.x === p.correctX && s.y === p.correctY && pieces.length > 1) {
        // Swap with next adjacent slot to force a scramble
        const swapIdx = (i + 1) % pieces.length;
        const temp = gridSlots[i];
        gridSlots[i] = gridSlots[swapIdx];
        gridSlots[swapIdx] = temp;
      }
    }

    // Assign scrambled grid slots to pieces
    pieces.forEach((piece, idx) => {
      const slot = gridSlots[idx];
      piece.setPosition(slot.x, slot.y);
      piece.currentGridRow = slot.row;
      piece.currentGridCol = slot.col;

      // AT GAME START, THE PUZZLE MUST BE 100% UNPLACED & UNLOCKED (SCRAMBLED)
      piece.placed = false;
      piece.locked = false;
    });

    return pieces;
  }
}
