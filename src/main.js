import './styles/reset.css';
import './styles/variables.css';
import './styles/app.css';

import { App } from './app/App.js';

function initApp() {
  const root = document.getElementById('app');
  if (!root) {
    console.error('[Main] #app root container not found');
    return;
  }

  // Prevent double initialization
  if (window.__PIXELCRAFT_APP__) return;

  const app = new App(root);
  console.log('[Main] PixelCraft PWA Application shell initialized.');
  
  // Expose app debug reference on window
  window.__PIXELCRAFT_APP__ = app;

  // Register PWA Service Worker in production mode
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[Main] ServiceWorker registered:', reg.scope))
      .catch(err => console.warn('[Main] ServiceWorker registration failed:', err));
  }
}

// Guaranteed execution on both initial load and cached page reload
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
