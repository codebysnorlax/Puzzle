/**
 * Security Utilities — XSS escaping, File validation, and Input sanitization
 */

/**
 * Escapes HTML characters in strings to prevent Cross-Site Scripting (XSS).
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Maximum allowed file size for user uploaded images (25 MB)
 */
export const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;

/**
 * Allowed MIME types for uploaded image files
 */
export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml'
]);

/**
 * Allowed file extensions for fallback MIME detection
 */
export const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'
]);

/**
 * Sanitizes file name by removing control characters and path traversal patterns.
 * @param {string} name
 * @returns {string}
 */
export function sanitizeFilename(name) {
  if (typeof name !== 'string') return 'custom_image';
  // Remove path components
  const baseName = name.replace(/^.*[\\/]/, '');
  // Remove invisible control chars & illegal characters
  return baseName.replace(/[\x00-\x1F\x7F<>"':|?*]/g, '_').trim() || 'custom_image';
}

/**
 * Validates user-uploaded image files against size, MIME, and extension rules.
 * @param {File|Blob} file
 * @returns {{ valid: boolean, error?: string, sanitizedName?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // 1. Size Validation
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 25 MB.`
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }

  // 2. Name Sanitization & Extension Validation
  const rawName = file.name || 'uploaded_image.png';
  const sanitizedName = sanitizeFilename(rawName);
  const ext = sanitizedName.split('.').pop()?.toLowerCase() || '';

  // 3. MIME type validation
  const type = file.type?.toLowerCase();
  const isTypeAllowed = type && ALLOWED_IMAGE_TYPES.has(type);
  const isExtAllowed = ALLOWED_EXTENSIONS.has(ext);

  if (!isTypeAllowed && !isExtAllowed) {
    return {
      valid: false,
      error: `Unsupported image format. Allowed formats: JPG, PNG, WEBP, GIF, AVIF, SVG.`
    };
  }

  return {
    valid: true,
    sanitizedName
  };
}
