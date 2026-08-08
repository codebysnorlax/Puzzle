import { Puzzle } from '../Puzzle.js';
import { Piece } from '../Piece.js';

/**
 * NormalPuzzle — Rectangular grid tile swap engine implementation
 */
export class NormalPuzzle extends Puzzle {
  generate() {
    this.pieces = [];
    const { rows, cols } = this.grid;
    const pieceWidth = this.boardLayout.width / cols;
    const pieceHeight = this.boardLayout.height / rows;

    let index = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const correctX = Math.round(this.boardLayout.x + c * pieceWidth);
        const correctY = Math.round(this.boardLayout.y + r * pieceHeight);

        const piece = new Piece({
          id: `normal_piece_${r}_${c}`,
          index,
          row: r,
          col: c,
          correctX,
          correctY,
          correctRotation: 0,
          width: pieceWidth,
          height: pieceHeight
        });

        piece.gridCols = cols;
        piece.gridRows = rows;

        this.pieces.push(piece);
        index++;
      }
    }

    // Automatically shuffle after generation
    this.shuffle();

    return this.pieces;
  }
}
