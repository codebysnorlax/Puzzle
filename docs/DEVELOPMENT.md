# Image Puzzle PWA — Development Guide

## 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

## 2. Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Starts local Vite server at `http://localhost:5173`.

### Production Build
```bash
npm run build
```
Outputs static bundle to `dist/` ready for Cloudflare Pages deployment.

### Preview Build
```bash
npm run preview
```
Previews production build locally.

---

## 3. Phase Development Workflow
Development must proceed strictly through the sequential phases outlined in the PRD:

| Phase | Description | Status |
|---|---|---|
| **Phase 0** | Repository Audit & Context Documentation | ✅ Completed |
| **Phase 1** | Application Shell & UI Scaffolding | ⏳ Pending |
| **Phase 2** | PixiJS Foundation & Canvas | ⏳ Pending |
| **Phase 3** | Image Pipeline & Resizing | ⏳ Pending |
| **Phase 4** | IndexedDB Storage Layer | ⏳ Pending |
| **Phase 5** | Normal Puzzle Engine | ⏳ Pending |
| **Phase 6** | Normal Puzzle Renderer | ⏳ Pending |
| **Phase 7** | Drag & Pointer Interaction | ⏳ Pending |
| **Phase 8** | Snap & Completion Validation | ⏳ Pending |
| **Phase 9** | Automatic Timer & Movement Tracking | ⏳ Pending |
| **Phase 10** | Animation System | ⏳ Pending |
| **Phase 11** | Jigsaw Geometry Engine | ⏳ Pending |
| **Phase 12** | Jigsaw Puzzle Rendering | ⏳ Pending |
| **Phase 13** | Jigsaw Snapping & Connected Piece Groups | ⏳ Pending |
| **Phase 14** | Centralized Difficulty System | ⏳ Pending |
| **Phase 15** | Results & Game History | ⏳ Pending |
| **Phase 16** | PWA Installation & Service Worker | ⏳ Pending |
| **Phase 17** | Performance Profiling Pass | ⏳ Pending |
| **Phase 18** | UX Polish & Accessibility Pass | ⏳ Pending |
| **Phase 19** | Production Build Verification | ⏳ Pending |
| **Phase 20** | Cloudflare Pages Deployment | ⏳ Pending |

---

## 4. Code Quality & Conventions
- Modular ES modules (`import`/`export`).
- Strict separation of concern: Engine logic does not touch PixiJS or DOM.
- Absolute precision on piece positioning and validation.
- JSDoc annotations for major public API functions.
