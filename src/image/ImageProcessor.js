import { ImageLoader } from './ImageLoader.js';
import { calculateTargetDimensions } from './ImageResize.js';

/**
 * ImageProcessor — High quality image scaling and canvas texture preparation
 */
export class ImageProcessor {
  /**
   * Process and downscale an image if needed while preserving aspect ratio
   * @param {string|File|Blob} source Image URL, Data URL, Blob URL, or File object
   * @param {number} maxDimension Max pixel dimension (default 2048)
   * @returns {Promise<{
   *   canvas: HTMLCanvasElement,
   *   blob: Blob,
   *   width: number,
   *   height: number,
   *   originalWidth: number,
   *   originalHeight: number,
   *   aspectRatio: number,
   *   isResized: boolean
   * }>}
   */
  static async processImage(source, maxDimension = 2048) {
    let loaded;
    if (source instanceof File || source instanceof Blob) {
      loaded = await ImageLoader.loadFromFile(source);
    } else if (typeof source === 'string') {
      loaded = await ImageLoader.loadFromUrl(source);
    } else {
      throw new Error(`[ImageProcessor] Unsupported image source type: ${typeof source}`);
    }

    const { img, width: origW, height: origH } = loaded;
    const target = calculateTargetDimensions(origW, origH, maxDimension);

    // Render onto offscreen canvas with high quality image smoothing
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, target.width, target.height);

    // Generate output blob
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', 0.92);
    });

    return {
      canvas,
      blob,
      width: target.width,
      height: target.height,
      originalWidth: origW,
      originalHeight: origH,
      aspectRatio: target.aspectRatio,
      isResized: target.isResized
    };
  }
}
