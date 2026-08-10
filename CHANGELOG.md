# PixiJS v8 Performance Optimization & Diagnostics

## 1. Key Missed Opportunities in PixiJS v8

* **No Spritesheet / Texture Atlas Usage:** You are currently serving multiple individual WebP files (`puzzle1.webp` through `puzzle13.webp`, `puzzle_on_call1.webp`, etc.). Loading loose textures forces PixiJS to switch GPU texture units frequently, breaking batch rendering.
* **Missing Render Groups (`isRenderGroup`):** PixiJS v8 introduced RenderGroups, which offload transform, alpha, and tint calculations to the GPU for subtrees.  
* **Unoptimized Drag-and-Drop Layering:** Standard re-parenting of active puzzle pieces to bring them to the front alters logical transforms.  
* **Hit-Testing Crawling:** Without setting explicit hitArea boundaries and eventMode optimizations, PixiJS recursively crawls complex scene nodes on every mouse/touch move.  
* **Text Rasterization Bottlenecks:** If you are using standard Canvas Text for timers, scores, or tile indices, each change re-rasterizes a new DOM canvas texture on the CPU.  

---

## 2. Bottlenecks & Their Root Causes

### **Identified Bottlenecks**

| Bottleneck Cause | Impact on Game Performance |
| :--- | :--- |
| **1. Loose WebP Image Loading** | High Draw Calls & Texture Swaps |
| **2. Unbatched Piece Dragging** | CPU Frame Drops during drag |
| **3. Complex Piece Masking** | Stencil Buffer / Filter Overhead |
| **4. Unmanaged Texture Cache** | Memory Leaks on Level Reset |

---

### **Detailed Analysis**

#### **Bottleneck 1: High Draw Calls & Texture Swapping (GPU Bottleneck)**
* **Problem:** Every un-batched loose WebP texture requires a separate GPU draw call. If a puzzle board has 50–100 pieces backed by loose individual textures, rendering requires dozens of draw calls per frame.
* **Fix:** Pack all puzzle assets and UI components into a single SpriteSheet / Texture Atlas.

#### **Bottleneck 2: Main-Thread CPU Overhead During Piece Dragging**
* **Problem:** Dragging puzzle pieces continuously recalculates matrix transforms down the scene graph. Re-parenting pieces to "bring them to the top" triggers parent-child transform recalibrations.
* **Fix:** Use PixiJS v8 RenderGroups and RenderLayers.

#### **Bottleneck 3: Expensive Masking for Jigsaw Shapes**
* **Problem:** Using complex Graphics masks or Sprite masks per puzzle piece triggers heavy stencil buffer operations or filter passes.
* **Fix:** Pre-bake puzzle edges into alpha channels or reuse shared GraphicsContext paths.

---

## 3. Step-by-Step Fixes & Code Improvements

### **Fix 1: Implement Asset Bundles & Spritesheets**

Instead of loading images individually, aggregate your assets into a single manifest using AssetPack or TexturePacker, and load them as a bundle.  

1. **Define an Asset Manifest (`manifest.ts`):**

```typescript
import { Assets } from 'pixi.js';

const manifest = {
  bundles: [
    {
      name: 'puzzle-level-1',
      assets: [
        { alias: 'puzzleSheet', src: 'assets/puzzles/level1.json' },
        { alias: 'moveSnd', src: 'assets/audio/move.wav' },
        { alias: 'winSnd', src: 'assets/audio/win.wav' },
      ],
    },
  ],
};

await Assets.init({ manifest });
await Assets.loadBundle('puzzle-level-1');
```

---

### **Fix 2: Optimize Scene Hierarchy with RenderGroups & RenderLayers**

Use RenderGroups to offload puzzle board calculations to the GPU, and RenderLayers to elevate the actively dragged piece visually without altering its logical parent.  

```typescript
import { Container, RenderLayer, Sprite } from 'pixi.js';

// 1. Isolate the puzzle board inside a GPU-accelerated RenderGroup
const puzzleBoard = new Container({
  isRenderGroup: true, // Offloads transform & tint calculations to the GPU
});

// 2. Create a RenderLayer for floating UI / actively dragged pieces
const dragLayer = new RenderLayer();
app.stage.addChild(puzzleBoard, dragLayer);

// 3. When a piece is grabbed:
piece.on('pointerdown', (event) => {
  dragLayer.attach(piece); // Renders piece on top without breaking logical hierarchy
});

// 4. When dropped:
piece.on('pointerup', () => {
  dragLayer.detach(piece); // Restores original rendering position
});
```

---

### **Fix 3: Optimize Event Modes and Hit Areas**

Prevent PixiJS from crawling non-interactive children by defining explicit hitArea bounding boxes and fine-tuning eventMode.  

```typescript
// Disable event crawling on non-interactive containers
puzzleBoard.interactiveChildren = false;

// Set static eventMode on draggable pieces
piece.eventMode = 'static'; 
piece.hitArea = new Rectangle(0, 0, pieceWidth, pieceHeight); // Bypasses bounds calculation
```

---

### **Fix 4: High-Performance Timers & Text**

If displaying dynamic UI elements (e.g., moves counter, timer), replace standard Text with BitmapText or MSDF Fonts.  

```typescript
import { BitmapText } from 'pixi.js';

// Pre-baked glyph atlas: 100x faster than canvas re-rasterization
const timerText = new BitmapText({
  text: 'Time: 00:00',
  style: {
    fontFamily: 'PuzzleFont', // MSDF / Bitmap font
    fontSize: 24,
  },
});
```

---

### **Fix 5: Automatic Memory Cleanup on Level Switch**

Prevent memory leaks when switching between puzzle stages by managing GPU texture unloading.  

```typescript
// Enable automatic Texture Garbage Collection on application init
await app.init({
  textureGCActive: true,
  textureGCMaxIdle: 1800, // Clean unused GPU textures after 30 seconds
  textureGCCheckCountMax: 600,
});

// Explicitly unload assets when leaving a level
async function cleanupLevel(levelBundleKey: string) {
  await Assets.unloadBundle(levelBundleKey); // Frees texture memory from GPU
}
```

---

## 4. Recommended Action Plan

* **Asset Pipeline:** Set up AssetPack to pack loose `.webp` assets into single `.json` sprite sheets.
* **Display Graph:** Wrap the puzzle board in a `Container({ isRenderGroup: true })` and implement `RenderLayer` for dragged tiles.  
* **Event System:** Set `eventMode = 'static'` and define explicit `hitArea` rects on pieces.  
* **UI Improvements:** Switch timer/score text to `BitmapText`.  

---

> [!TIP]
> **Would you like help setting up the AssetPack configuration or refactoring the drag-and-drop piece engine with PixiJS v8 RenderLayer?**
