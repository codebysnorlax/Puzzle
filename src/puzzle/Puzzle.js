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

  checkCompletion() {
    this.isComplete = PuzzleValidator.isPuzzleComplete(this.pieces);
    return this.isComplete;
  }
}
