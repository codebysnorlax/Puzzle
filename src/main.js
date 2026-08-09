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
  window.__PIXELCRAFT_APP__ = app;

  // Register PWA Service Worker in secure context / production mode
  if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[Main] ServiceWorker registered with scope:', reg.scope);
        app.handleServiceWorkerRegistration(reg);

        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Main] New app version available in ServiceWorker cache');
              app.showUpdateBanner();
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[Main] ServiceWorker registration failed:', err);
      });

    // Handle controller reload on update
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }
}

// Guaranteed execution on both initial load and cached page reload
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

