import { Piece } from './Piece.js';
import { PuzzleGenerator } from './PuzzleGenerator.js';
import { Shuffle } from './Shuffle.js';
import { PuzzleValidator } from './PuzzleValidator.js';

/**
 * Puzzle — Base Class for Puzzle Engine
 */
export class Puzzle {
  constructor({ imageWidth, imageHeight, viewportWidth, viewportHeight, difficulty = 'normal', seed = Date.now() }) {
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.difficulty = difficulty;
    this.seed = seed;

    const { cols, rows } = PuzzleGenerator.calculateGridDimensions(imageWidth / imageHeight, difficulty);
    this.cols = cols;
    this.rows = rows;
    this.grid = { cols, rows };

    this.boardLayout = PuzzleGenerator.calculateBoardLayout(imageWidth, imageHeight, viewportWidth, viewportHeight);
    
    this.pieces = [];
    this.isComplete = false;
  }

  generate() {
    this.pieces = [];
    const pieceWidth = Math.round(this.boardLayout.width / this.cols);
    const pieceHeight = Math.round(this.boardLayout.height / this.rows);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const correctX = Math.round(this.boardLayout.x + c * pieceWidth);
        const correctY = Math.round(this.boardLayout.y + r * pieceHeight);

        const piece = new Piece({
          id: `piece_${r}_${c}`,
          row: r,
          col: c,
          correctX,
          correctY,
          x: correctX,
          y: correctY,
          width: pieceWidth,
          height: pieceHeight
        });

        piece.currentGridRow = r;
        piece.currentGridCol = c;

        this.pieces.push(piece);
      }
    }

    // Scramble pieces among grid slots
    Shuffle.shufflePieces(this.pieces, this.boardLayout, this.viewportWidth, this.viewportHeight, this.seed);
  }

  shuffle() {
    Shuffle.shufflePieces(this.pieces, this.boardLayout, this.viewportWidth, this.viewportHeight, this.seed);
  }

  resize(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.boardLayout = PuzzleGenerator.calculateBoardLayout(this.imageWidth, this.imageHeight, viewportWidth, viewportHeight);
    
    const pieceWidth = Math.round(this.boardLayout.width / this.cols);
    const pieceHeight = Math.round(this.boardLayout.height / this.rows);

    this.pieces.forEach(piece => {
      piece.correctX = Math.round(this.boardLayout.x + piece.col * pieceWidth);
      piece.correctY = Math.round(this.boardLayout.y + piece.row * pieceHeight);
      piece.width = pieceWidth;
      piece.height = pieceHeight;

      if (piece.currentGridRow !== undefined && piece.currentGridCol !== undefined) {
        piece.x = Math.round(this.boardLayout.x + piece.currentGridCol * pieceWidth);
        piece.y = Math.round(this.boardLayout.y + piece.currentGridRow * pieceHeight);
      } else {
        piece.x = piece.correctX;
        piece.y = piece.correctY;
      }
    });
  }

  checkCompletion() {
    this.isComplete = PuzzleValidator.isPuzzleComplete(this.pieces);
    return this.isComplete;
  }
}
