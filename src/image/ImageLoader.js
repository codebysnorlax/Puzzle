/**
 * ImageLoader — Asynchronous image loading, validation, and decoding
 */
export class ImageLoader {
  /**
   * Load image from URL string, Data URL, or Blob URL
   * @param {string} url 
   * @returns {Promise<{ img: HTMLImageElement, width: number, height: number, url: string }>}
   */
  static loadFromUrl(url) {
    return new Promise((resolve, reject) => {
      if (!url) {
        return reject(new Error('[ImageLoader] Empty URL provided'));
      }

      const img = new Image();
      
      // IMPORTANT: Only set crossOrigin for remote http/https URLs.
      // Do NOT set crossOrigin on blob: or data: URLs as browser security will reject them.
      if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        resolve({
          img,
          width: img.naturalWidth || img.width || 800,
          height: img.naturalHeight || img.height || 600,
          url
        });
      };

      img.onerror = (err) => {
        console.error('[ImageLoader] Image load error for URL:', url);
        reject(new Error(`[ImageLoader] Failed to load image from URL: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * Validate and load user uploaded or cached File/Blob object
   * @param {File|Blob} file 
   * @returns {Promise<{ img: HTMLImageElement, width: number, height: number, file: File|Blob, objectUrl: string }>}
   */
  static loadFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('[ImageLoader] No file provided'));
      }

      // Permissive check: allow HTMLImageElement to decode even if file.type is blank or generic
      if (file.type && !file.type.startsWith('image/') && file.type !== 'application/octet-stream') {
        console.warn(`[ImageLoader] Non-standard MIME type '${file.type}', attempting image decode anyway...`);
      }

      const objectUrl = URL.createObjectURL(file);

      this.loadFromUrl(objectUrl)
        .then(({ img, width, height }) => {
          resolve({
            img,
            width,
            height,
            file,
            objectUrl
          });
        })
        .catch(err => {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        });
    });
  }
}
