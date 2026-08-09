import { Application } from 'pixi.js';

/**
 * PixiApp — PixiJS v8 Application Lifecycle Manager
 * Handles responsive canvas binding, DPR resolution scaling, theme inheritance, and clean destruction.
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
   * Get hex background color for current theme
   * @param {string} theme 
   * @returns {number}
   */
  getThemeBackgroundColor(theme = null) {
    const activeTheme = theme || document.documentElement.getAttribute('data-theme') || 'dark';
    return activeTheme === 'light' ? 0xf1f5f9 : 0x0f172a;
  }

  /**
   * Initialize PixiJS Application inside target DOM element
   * @param {HTMLElement} containerElement 
   */
  async init(containerElement) {
    this.container = containerElement;

    if (!containerElement) {
      console.error('[PixiApp ERROR] Null containerElement passed to PixiApp.init()!');
      throw new Error('[PixiApp] Cannot initialize PixiJS on null containerElement');
    }

    if (this.isInitialized && this.app && this.app.renderer) {
      if (this.app.canvas && this.app.canvas.parentNode !== containerElement) {
        containerElement.appendChild(this.app.canvas);
      }
      this.app.stage.removeChildren();
      this.updateTheme();
      return;
    }

    this.app = new Application();
    const bgColor = this.getThemeBackgroundColor();
    
    // PixiJS v8 async initialization protocol with theme-aware background
    await this.app.init({
      resizeTo: containerElement,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundColor: bgColor,
      backgroundAlpha: 1,
      antialias: true
    });

    const canvas = this.app.canvas;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1';

    if (canvas.parentNode !== containerElement) {
      containerElement.appendChild(canvas);
    }

    // Attach responsive ResizeObserver
    this.setupResizeObserver();

    this.isInitialized = true;
  }

  /**
   * Dynamically update background color when light/dark theme toggles
   * @param {string} theme 
   */
  updateTheme(theme = null) {
    if (!this.app || !this.app.renderer) return;
    const bgColor = this.getThemeBackgroundColor(theme);
    if (this.app.renderer.background) {
      this.app.renderer.background.color = bgColor;
    }
    if (this.app.renderer.render && this.app.stage) {
      this.app.renderer.render(this.app.stage);
    }
  }

  setupResizeObserver() {
    if (!this.container) return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.app && this.app.renderer) {
        this.app.resize();
        if (this.onResize) {
          const width = (this.container && this.container.clientWidth) || window.innerWidth;
          const height = (this.container && this.container.clientHeight) || window.innerHeight;
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
        this.app.destroy(true, { children: true });
      } catch (err) {
        console.warn('[PixiApp] Non-fatal error during destroy cleanup:', err);
      }
      this.app = null;
    }

    this.isInitialized = false;
  }
}
