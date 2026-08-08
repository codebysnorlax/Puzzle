import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';

/**
 * PixiApp — PixiJS v8 Application Lifecycle Manager
 * Handles responsive canvas binding, DPR resolution scaling, ticker loop, and clean destruction.
 */
export class PixiApp {
  constructor() {
    this.app = null;
    this.container = null;
    this.isInitialized = false;
    this.resizeObserver = null;
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
      backgroundColor: 0x090d16,
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
    console.log('[PixiApp] PixiJS v8 engine initialized successfully.');

    // Render test sprite scene (Phase 2 requirement)
    this.renderTestScene();
  }

  setupResizeObserver() {
    if (!this.container) return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.app && this.app.renderer) {
        this.app.resize();
      }
    });
    this.resizeObserver.observe(this.container);
  }

  /**
   * Render test scene to verify WebGL rendering and 60fps ticker loop
   */
  renderTestScene() {
    if (!this.app) return;

    const testContainer = new Container();
    this.app.stage.addChild(testContainer);

    // Draw styled puzzle piece test card
    const graphics = new Graphics();
    graphics.roundRect(-80, -80, 160, 160, 20);
    graphics.fill({ color: 0x6366f1, alpha: 0.85 });
    graphics.stroke({ width: 4, color: 0xa855f7, alpha: 1 });

    // Inner tab indicator
    graphics.circle(0, -80, 24);
    graphics.fill({ color: 0x6366f1, alpha: 0.85 });
    graphics.stroke({ width: 4, color: 0xa855f7, alpha: 1 });

    testContainer.addChild(graphics);

    // Text label
    const textStyle = new TextStyle({
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center'
    });
    const label = new Text({ text: 'PixiJS v8\nReady', style: textStyle });
    label.anchor.set(0.5);
    testContainer.addChild(label);

    const updatePosition = () => {
      if (!this.app || !this.app.renderer) return;
      const width = this.app.renderer.width / (this.app.renderer.resolution || 1);
      const height = this.app.renderer.height / (this.app.renderer.resolution || 1);
      testContainer.x = width / 2;
      testContainer.y = height / 2;
    };
    updatePosition();

    // Smooth rotation ticker animation
    this.app.ticker.add((ticker) => {
      testContainer.rotation += 0.008 * ticker.deltaTime;
      updatePosition();
    });
  }

  /**
   * Destroy Pixi application and release canvas resources cleanly
   */
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

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
