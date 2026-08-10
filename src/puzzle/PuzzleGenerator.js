/**
 * PuzzleGenerator — Grid layout geometry calculator based on difficulty and aspect ratio
 */
export class PuzzleGenerator {
  /**
   * Target piece counts per difficulty level
   */
  static DIFFICULTY_PIECE_COUNTS = {
    normal: 25,   // ~5x5 grid (25 pieces)
    hard: 49,     // ~7x7 grid (49 pieces)
    expert: 49,   // ~7x7 grid (49 pieces - Expert difficulty)
    extreme: 64   // ~8x8 grid
  };

  /**
   * Calculate grid rows (R) and columns (C) matching aspect ratio
   */
  static calculateGridDimensions(aspectRatio, difficulty = 'normal') {
    const targetCount = this.DIFFICULTY_PIECE_COUNTS[difficulty] || 25;
    
    let rows = Math.round(Math.sqrt(targetCount / aspectRatio));
    rows = Math.max(2, rows);
    let cols = Math.round(targetCount / rows);
    cols = Math.max(2, cols);

    return { rows, cols, totalPieces: rows * cols };
  }

  /**
   * Calculate centered board area inside viewport with responsive padding
   */
  static calculateBoardLayout(imageWidth, imageHeight, viewportWidth, viewportHeight, customPadding) {
    const padding = customPadding !== undefined ? customPadding : (viewportWidth < 640 ? 12 : 24);
    const imgAspect = imageWidth / imageHeight;

    const topOffset = viewportWidth < 640 ? 84 : 96; // Height occupied by top bar + undo/redo bar
    
    const availWidth = Math.max(160, viewportWidth - padding * 2);
    // Deduct top offset to scale the board down in height and prevent header overlaps
    const isPortrait = viewportHeight > viewportWidth;
    const verticalDeduct = isPortrait ? topOffset : 40;
    const availHeight = Math.max(160, viewportHeight - padding * 2 - verticalDeduct);

    const boardWidth = imgAspect >= (availWidth / availHeight)
      ? availWidth
      : availHeight * imgAspect;
    const boardHeight = imgAspect >= (availWidth / availHeight)
      ? availWidth / imgAspect
      : availHeight;

    const boardX = Math.round((viewportWidth - boardWidth) / 2);
    
    // Center the board vertically in the remaining space below the top offset
    let boardY;
    if (isPortrait) {
      const remainingHeight = viewportHeight - topOffset;
      boardY = Math.round(topOffset + (remainingHeight - boardHeight) / 2);
    } else {
      boardY = Math.round((viewportHeight - boardHeight) / 2);
    }

    return {
      x: boardX,
      y: boardY,
      width: Math.round(boardWidth),
      height: Math.round(boardHeight),
      aspectRatio: imgAspect
    };
  }
}
