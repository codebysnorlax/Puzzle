/**
 * ImageResize — Pure mathematical utilities for aspect-ratio preserving dimensions
 */

/**
 * Calculate target dimensions maintaining exact aspect ratio
 * @param {number} width Original width
 * @param {number} height Original height
 * @param {number} maxDimension Max allowed width or height in pixels (default: 2048)
 * @returns {{ width: number, height: number, aspectRatio: number, isResized: boolean }}
 */
export function calculateTargetDimensions(width, height, maxDimension = 2048) {
  if (!width || !height || width <= 0 || height <= 0) {
    throw new Error(`[ImageResize] Invalid dimensions: ${width}x${height}`);
  }

  const aspectRatio = width / height;

  if (width <= maxDimension && height <= maxDimension) {
    return {
      width: Math.round(width),
      height: Math.round(height),
      aspectRatio,
      isResized: false
    };
  }

  let targetWidth, targetHeight;
  if (width >= height) {
    targetWidth = maxDimension;
    targetHeight = Math.round(maxDimension / aspectRatio);
  } else {
    targetHeight = maxDimension;
    targetWidth = Math.round(maxDimension * aspectRatio);
  }

  return {
    width: targetWidth,
    height: targetHeight,
    aspectRatio,
    isResized: true
  };
}
