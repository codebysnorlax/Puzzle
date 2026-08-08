import { PuzzleGenerator } from './PuzzleGenerator.js';
import { Shuffle } from './Shuffle.js';
import { PuzzleValidator } from './PuzzleValidator.js';

/**
 * Base Abstract Puzzle Engine Class
 */
export class Puzzle {
  constructor({
    imageWidth,
    imageHeight,
    viewportWidth,
    viewportHeight,
    difficulty = 'normal',
    seed = Date.now()
  }) {
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.difficulty = difficulty;
    this.seed = seed;

    this.aspectRatio = imageWidth / imageHeight;
    this.grid = PuzzleGenerator.calculateGridDimensions(this.aspectRatio, difficulty);
    this.boardLayout = PuzzleGenerator.calculateBoardLayout(imageWidth, imageHeight, viewportWidth, viewportHeight);

    this.pieces = [];
    this.isComplete = false;
  }

  generate() {
    throw new Error('[Puzzle] Abstract method generate() must be implemented by subclass.');
  }

  shuffle() {
    Shuffle.shufflePieces(this.pieces, this.boardLayout, this.viewportWidth, this.viewportHeight, this.seed);
  }

  /**
   * Recalculate board geometry and update piece coordinates on window/viewport resize
   */
  resize(viewportWidth, viewportHeight) {
    if (!viewportWidth || !viewportHeight || (viewportWidth === this.viewportWidth && viewportHeight === this.viewportHeight)) {
      return;
    }

    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    const oldBoard = { ...this.boardLayout };
    this.boardLayout = PuzzleGenerator.calculateBoardLayout(this.imageWidth, this.imageHeight, viewportWidth, viewportHeight);

    const { rows, cols } = this.grid;
    const pieceWidth = this.boardLayout.width / cols;
    const pieceHeight = this.boardLayout.height / rows;

    this.pieces.forEach(piece => {
      // Update correct target position
      piece.correctX = Math.round(this.boardLayout.x + piece.col * pieceWidth);
      piece.correctY = Math.round(this.boardLayout.y + piece.row * pieceHeight);
      piece.width = pieceWidth;
      piece.height = pieceHeight;

      // Update current grid slot position
      if (piece.currentGridRow !== undefined && piece.currentGridCol !== undefined) {
        piece.x = Math.round(this.boardLayout.x + piece.currentGridCol * pieceWidth);
        piece.y = Math.round(this.boardLayout.y + piece.currentGridRow * pieceHeight);
      } else {
        piece.x = piece.correctX;
        piece.y = piece.correctY;
      }
    });

    console.log(`[Puzzle] Resized puzzle layout to viewport: ${viewportWidth}x${viewportHeight}`);
  }

  checkCompletion() {
    this.isComplete = PuzzleValidator.isPuzzleComplete(this.pieces);
    return this.isComplete;
  }
}
