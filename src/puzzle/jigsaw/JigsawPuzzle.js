import { Puzzle } from '../Puzzle.js';
import { JigsawPiece } from './JigsawPiece.js';
import { SeededRandom } from '../SeededRandom.js';

/**
 * JigsawPuzzle — Interlocking organic jigsaw puzzle generator matching technical specification
 */
export class JigsawPuzzle extends Puzzle {
  generate() {
    this.pieces = [];
    const { rows, cols } = this.grid;
    const pieceWidth = this.boardLayout.width / cols;
    const pieceHeight = this.boardLayout.height / rows;

    const rng = new SeededRandom(this.seed);

    // Helper to generate rich randomized edge parameter object
    const createEdgeData = () => {
      return {
        tabType: rng.next() > 0.5 ? 1 : -1,                      // 1 = Tab, -1 = Slot
        tabSize: rng.rangeFloat(0.16, 0.26),                     // Varied tab depth (Small vs Large Tab)
        tabPos: rng.rangeFloat(0.44, 0.56),                      // Varied tab position along edge
        neckWidth: rng.rangeFloat(0.07, 0.12),                   // Narrow vs Wide neck
        headWidth: rng.rangeFloat(0.18, 0.25),                   // Bulbous head width
        curveBias: rng.rangeFloat(-0.04, 0.04)                   // Organic baseline curve variation
      };
    };

    // 1. Generate Shared Horizontal Edge Matrix: size rows x (cols - 1)
    const horizEdges = Array.from({ length: rows }, () =>
      Array.from({ length: cols - 1 }, () => createEdgeData())
    );

    // 2. Generate Shared Vertical Edge Matrix: size (rows - 1) x cols
    const vertEdges = Array.from({ length: rows - 1 }, () =>
      Array.from({ length: cols }, () => createEdgeData())
    );

    // 3. Construct pieces with complementary edges & 100% flat outer boundaries
    let index = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const correctX = Math.round(this.boardLayout.x + c * pieceWidth);
        const correctY = Math.round(this.boardLayout.y + r * pieceHeight);

        // Top Edge
        let topEdge;
        if (r === 0) {
          topEdge = { tabType: 0 }; // Flat outer edge
        } else {
          const neighborEdge = vertEdges[r - 1][c];
          topEdge = {
            ...neighborEdge,
            tabType: -neighborEdge.tabType // Complementary slot/tab
          };
        }

        // Bottom Edge
        let bottomEdge;
        if (r === rows - 1) {
          bottomEdge = { tabType: 0 }; // Flat outer edge
        } else {
          bottomEdge = vertEdges[r][c];
        }

        // Left Edge
        let leftEdge;
        if (c === 0) {
          leftEdge = { tabType: 0 }; // Flat outer edge
        } else {
          const neighborEdge = horizEdges[r][c - 1];
          leftEdge = {
            ...neighborEdge,
            tabType: -neighborEdge.tabType // Complementary slot/tab
          };
        }

        // Right Edge
        let rightEdge;
        if (c === cols - 1) {
          rightEdge = { tabType: 0 }; // Flat outer edge
        } else {
          rightEdge = horizEdges[r][c];
        }

        const edges = {
          top: topEdge,
          bottom: bottomEdge,
          left: leftEdge,
          right: rightEdge
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

        piece.gridCols = cols;
        piece.gridRows = rows;

        this.pieces.push(piece);
        index++;
      }
    }

    // Shuffle pieces
    this.shuffle();

    return this.pieces;
  }
}
