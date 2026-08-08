import { Puzzle } from '../Puzzle.js';
import { JigsawPiece } from './JigsawPiece.js';
import { SeededRandom } from '../SeededRandom.js';

/**
 * JigsawPuzzle — Interlocking jigsaw puzzle generator using a shared edge matrix
 */
export class JigsawPuzzle extends Puzzle {
  generate() {
    this.pieces = [];
    const { rows, cols } = this.grid;
    const pieceWidth = this.boardLayout.width / cols;
    const pieceHeight = this.boardLayout.height / rows;

    const rng = new SeededRandom(this.seed);

    // 1. Generate Shared Horizontal Edge Matrix: size rows x (cols - 1)
    const horizEdges = Array.from({ length: rows }, () =>
      Array.from({ length: cols - 1 }, () => (rng.next() > 0.5 ? 1 : -1))
    );

    // 2. Generate Shared Vertical Edge Matrix: size (rows - 1) x cols
    const vertEdges = Array.from({ length: rows - 1 }, () =>
      Array.from({ length: cols }, () => (rng.next() > 0.5 ? 1 : -1))
    );

    // 3. Construct pieces with complementary edges
    let index = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const correctX = Math.round(this.boardLayout.x + c * pieceWidth);
        const correctY = Math.round(this.boardLayout.y + r * pieceHeight);

        // Edge configuration
        const edges = {
          top: r === 0 ? 0 : -vertEdges[r - 1][c],      // Complement of neighbor above
          bottom: r === rows - 1 ? 0 : vertEdges[r][c], // Shared vertical edge
          left: c === 0 ? 0 : -horizEdges[r][c - 1],    // Complement of neighbor left
          right: c === cols - 1 ? 0 : horizEdges[r][c]  // Shared horizontal edge
        };

        const piece = new JigsawPiece({
          id: `jigsaw_piece_${r}_${c}`,
          index,
          row: r,
          col: c,
          correctX,
          correctY,
          correctRotation: 0,
          width: pieceWidth,
          height: pieceHeight,
          edges
        });

        this.pieces.push(piece);
        index++;
      }
    }

    // Shuffle pieces
    this.shuffle();

    return this.pieces;
  }
}
