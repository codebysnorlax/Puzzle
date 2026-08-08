import { Application } from 'pixi.js';

/**
 * PixiApp — PixiJS v8 Application Lifecycle Manager
 * Handles responsive canvas binding, DPR resolution scaling, and clean destruction.
 */
export class PixiApp {
  constructor() {
    this.app = null;
    this.container = null;
    this.isInitialized = false;
    this.resizeObserver = null;
    this.onResize = null;
  }

  /**
   * Initialize PixiJS Application inside target DOM element
   * @param {HTMLElement} containerElement 
   */
  async init(containerElement) {
    if (this.isInitialized) return;
    this.container = containerElement;

    this.app = new Application();
    
    // PixiJS v8 async initialization protocol
    await this.app.init({
      resizeTo: containerElement,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundColor: 0x0f141c, // Matches --bg-base theme color
      antialias: true
    });

    const canvas = this.app.canvas;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Clear previous children in container if any
    containerElement.innerHTML = '';
    containerElement.appendChild(canvas);

    // Attach responsive ResizeObserver
    this.setupResizeObserver();

    this.isInitialized = true;
    console.log('[PixiApp] PixiJS engine initialized cleanly.');
  }

  setupResizeObserver() {
    if (!this.container) return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.app && this.app.renderer) {
        this.app.resize();
        if (this.onResize) {
          const width = this.container.clientWidth || window.innerWidth;
          const height = this.container.clientHeight || window.innerHeight;
          this.onResize(width, height);
        }
      }
    });
    this.resizeObserver.observe(this.container);
  }

  /**
   * Destroy Pixi application and release canvas resources cleanly
   */
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.onResize = null;

    if (this.app) {
      try {
        const canvas = this.app.canvas;
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        this.app.destroy(true, { children: true, texture: true });
      } catch (err) {
        console.warn('[PixiApp] Non-fatal error during destroy cleanup:', err);
      }
      this.app = null;
    }

    this.isInitialized = false;
    console.log('[PixiApp] PixiJS application instance destroyed.');
  }
}
