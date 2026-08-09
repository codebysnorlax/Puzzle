/**
 * AppVersion — Centralized Versioning & App Metadata Configuration
 */
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Puzzle';
export const BUILD_DATE = '2026-08-09';

/**
 * Check if the application is currently running as an installed PWA (Standalone mode).
 * @returns {boolean}
 */
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Get detailed environment runtime description
 * @returns {object}
 */
export function getAppInfo() {
  return {
    version: APP_VERSION,
    appName: APP_NAME,
    buildDate: BUILD_DATE,
    isStandalone: isStandalone(),
    hasServiceWorker: 'serviceWorker' in navigator,
    hasIndexedDB: 'indexedDB' in window,
    userAgent: navigator.userAgent
  };
}
