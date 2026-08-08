import './styles/reset.css';
import './styles/variables.css';
import './styles/app.css';

import { App } from './app/App.js';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app');
  if (!root) {
    console.error('[Main] #app root container not found');
    return;
  }

  const app = new App(root);
  console.log('[Main] PixelCraft PWA Application shell initialized.');
  
  // Expose app debug reference on window for testing
  window.__PIXELCRAFT_APP__ = app;

  // Register PWA Service Worker
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[Main] ServiceWorker registered:', reg.scope))
        .catch(err => console.warn('[Main] ServiceWorker registration failed:', err));
    });
  }
});
