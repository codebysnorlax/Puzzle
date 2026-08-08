/**
 * PuzzleGenerator — Grid layout geometry calculator based on difficulty and aspect ratio
 */
export class PuzzleGenerator {
  /**
   * Target piece counts per difficulty level
   */
  static DIFFICULTY_PIECE_COUNTS = {
    easy: 9,      // ~3x3
    normal: 16,   // ~4x4
    hard: 25,     // ~5x5
    expert: 36,   // ~6x6
    extreme: 64   // ~8x8
  };

  /**
   * Calculate grid rows (R) and columns (C) matching aspect ratio
   */
  static calculateGridDimensions(aspectRatio, difficulty = 'normal') {
    const targetCount = this.DIFFICULTY_PIECE_COUNTS[difficulty] || 16;
    
    // C / R approx aspectRatio  ==>  C = R * aspectRatio
    // R * C = targetCount  ==>  R^2 * aspectRatio = targetCount
    let rows = Math.round(Math.sqrt(targetCount / aspectRatio));
    rows = Math.max(2, rows);
    let cols = Math.round(targetCount / rows);
    cols = Math.max(2, cols);

    return { rows, cols, totalPieces: rows * cols };
  }

  /**
   * Calculate centered board area inside viewport
   */
  static calculateBoardLayout(imageWidth, imageHeight, viewportWidth, viewportHeight, padding = 40) {
    const imgAspect = imageWidth / imageHeight;
    const availWidth = Math.max(200, viewportWidth - padding * 2);
    const availHeight = Math.max(200, viewportHeight - padding * 2);
    const availAspect = availWidth / availHeight;

    let boardWidth, boardHeight;
    if (imgAspect >= availAspect) {
      boardWidth = availWidth;
      boardHeight = boardWidth / imgAspect;
    } else {
      boardHeight = availHeight;
      boardWidth = boardHeight * imgAspect;
    }

    const boardX = Math.round((viewportWidth - boardWidth) / 2);
    const boardY = Math.round((viewportHeight - boardHeight) / 2);

    return {
      x: boardX,
      y: boardY,
      width: Math.round(boardWidth),
      height: Math.round(boardHeight),
      aspectRatio: imgAspect
    };
  }
}
