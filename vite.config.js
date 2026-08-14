import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    port: 5173,
    host: true
  },
  plugins: [
    {
      name: 'copy-functions',
      closeBundle() {
        // Copy functions directory to dist for Cloudflare Pages
        const functionsDir = resolve('dist/functions');
        if (!existsSync(functionsDir)) {
          mkdirSync(functionsDir, { recursive: true });
        }
        const apiDir = resolve('dist/functions/api');
        if (!existsSync(apiDir)) {
          mkdirSync(apiDir, { recursive: true });
        }
        copyFileSync(
          resolve('functions/api/stats.js'),
          resolve('dist/functions/api/stats.js')
        );
        console.log('✓ Copied functions/api/stats.js to dist/');
      }
    }
  ]
});
