# Image Puzzle PWA — Architecture Specification

## 1. System Overview
The Image Puzzle PWA is a local-first, client-side Progressive Web Application allowing users to solve image puzzles in **Normal** (grid-based rectangular pieces) and **Jigsaw** (interlocking tab & slot pieces) modes.

The architecture strictly separates puzzle domain logic, rendering, storage, input, and UI presentation layers.

```
┌──────────────────────────────────────────────────────────────┐
│                           UI Layer                           │
│     HomeView       GameView       ResultView    SettingsView │
└──────────────────────────────┬───────────────────────────────┘
                               │ Events / State Transitions
┌──────────────────────────────▼──────────────────────────────┐
│                          App Core                           │
│        App.js            Game.js             GameState      │
└──────────────┬───────────────┬──────────────┬───────────────┘
               │               │              │
┌──────────────▼──────┐ ┌──────▼───────┐ ┌────▼───────────────┐
│    Puzzle Engine    │ │   Renderer   │ │     Storage        │
│ Normal / Jigsaw     │ │ PixiJS App   │ │ IndexedDB Store    │
│ Generator / Solve   │ │ Canvas Scene │ │ localStorage Config│
└─────────────────────┘ └──────────────┘ └────────────────────┘
```

## 2. Directory Structure
```text
project/
├── public/
│   ├── icons/
│   └── puzzles/
├── src/
│   ├── app/
│   │   ├── App.js           # Application entry orchestrator
│   │   ├── Game.js          # Active game loop and state manager
│   │   ├── GameState.js     # State machine (IDLE, READY, RUNNING, SOLVED, ERROR)
│   │   └── Input.js         # Unified Pointer events handler
│   ├── puzzle/
│   │   ├── Puzzle.js        # Base Puzzle class
│   │   ├── Piece.js         # Abstract Piece data model
│   │   ├── PuzzleGenerator.js # Core piece layout generator
│   │   ├── PuzzleValidator.js # Pure math completion detector
│   │   ├── Shuffle.js       # Piece layout shuffler
│   │   ├── SeededRandom.js  # PRNG seed generator
│   │   ├── normal/
│   │   │   └── NormalPuzzle.js # Grid piece generation logic
│   │   └── jigsaw/
│   │       ├── JigsawPuzzle.js # Interlocking jigsaw engine
│   │       ├── JigsawPiece.js     # Jigsaw piece model & connected groups
│   │       └── JigsawShape.js     # Tab/Slot bezier geometry curves
│   ├── renderer/
│   │   ├── PixiApp.js               # PixiJS Application lifecycle wrapper
│   │   ├── PuzzleRenderer.js        # Canvas board & piece sprite manager
│   │   ├── PieceRenderer.js         # Piece texture & mask renderer
│   │   └── ReferenceRenderer.js     # Reference image overlay/drawer
│   ├── animation/
│   │   ├── PieceAnimations.js       # Snap / Lock / Drag animations (Pixi)
│   │   └── UIAnimations.js          # View transition animations
│   ├── image/
│   │   ├── ImageLoader.js           # File & URL loader
│   │   ├── ImageProcessor.js        # Canvas resize / WebP conversion
│   │   └── ImageResize.js           # Aspect ratio constraint calculation
│   ├── game/
│   │   ├── Timer.js                 # performance.now() high-precision timer
│   │   ├── MovementTracker.js       # Move counter & distance tracker
│   │   ├── Score.js                 # Score & stats generator
│   │   └── Completion.js            # Completion sequence handler
│   ├── storage/
│   │   ├── IndexedDB.js             # IndexedDB wrapper (PuzzleDB)
│   │   ├── ImageStore.js            # User image Blobs store
│   │   ├── GameHistory.js           # Game stats & history store
│   │   └── SettingsStore.js         # User preferences in localStorage
│   ├── ui/
│   │   ├── HomeView.js              # Main menu & image selector
│   │   ├── GameView.js              # Game UI container & HUD
│   │   ├── ResultView.js            # Completion modal & summary
│   │   └── SettingsView.js          # Difficulty & preferences settings
│   ├── styles/
│   │   ├── reset.css                # CSS Reset
│   │   ├── variables.css            # Design tokens & color system
│   │   └── app.css                  # Core UI & responsive layout
│   └── main.js                      # Application entry point
├── docs/                            # Context documentation
├── index.html
├── manifest.webmanifest
├── package.json
└── vite.config.js
```

## 3. Module Responsibilities & Interfaces

### App Core (`src/app/`)
- Orchestrates view rendering and transitions.
- Manages global state transitions via explicit finite state machine (`GameState`).
- Routes pointer events from `Input.js` to active puzzle renderer.

### Puzzle Engine (`src/puzzle/`)
- Pure JavaScript mathematics for piece positioning, shuffling, and edge calculation.
- Does **not** depend on PixiJS, DOM, or rendering APIs.
- Generates puzzle pieces deterministically from an integer/string seed.

### Renderer (`src/renderer/`)
- Uses **PixiJS** for rendering canvas pieces, dragging feedback, and animations.
- Manages WebGL context creation, device pixel ratio scaling, and viewport resizing.
- Receives piece state updates from Puzzle Engine and syncs Pixi Sprites/Containers.

### Storage Layer (`src/storage/`)
- Uses `localStorage` for light UI preferences (theme, last difficulty).
- Uses `IndexedDB` (`PuzzleDB`) for image Blobs, thumbnail caches, and match history.

### Image Pipeline (`src/image/`)
- Decodes user uploaded image files or built-in puzzle paths.
- Resizes oversized camera images to optimal rendering dimensions while preserving aspect ratios.

## 4. State Machine
```text
┌──────┐      Select Image / Start      ┌───────┐      First Piece Move      ┌─────────┐
│ IDLE │ ──────────────────────────────►│ READY │ ──────────────────────────►│ RUNNING │
└──────┘                                └───────┘                            └────┬────┘
   ▲                                        ▲                                     │
   │                                        │                                     │ All Pieces Placed
   │               Reset Game               │                                     │ & Validated
   └────────────────────────────────────────┴─────────────────────────────────────┼────────┐
                                                                                  │        |
                                                                                  ▼        ▼
                                                                             ┌────────┐ ┌────────┐
                                                                             │ SOLVED │ │  ERROR │
                                                                             └────────┘ └────────┘
```

## 5. Rendering & Device-Pixel Handling
- Canvas dimensions dynamically scale to match container dimensions.
- `app.renderer.resolution = window.devicePixelRatio || 1` handles high-DPI displays without blurring.
- Pieces are texture clipped using Pixi Graphics masks or pre-baked textures for max performance.

## 6. Hosting & Deployment Architecture
- Pure static web app targeting **Cloudflare Pages**.
- No backend server required.
- Full offline support via Service Worker caching application shell and assets.
