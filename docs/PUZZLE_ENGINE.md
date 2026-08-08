# Image Puzzle PWA — Puzzle Engine Specification

## 1. Core Data Models

### Piece Data Interface
Every piece cleanly decouples its **Correct State** from its **Current State**:

```js
{
  id: "piece_0_2",
  index: 2,
  row: 0,
  col: 2,
  
  // Target position (Board space)
  correctX: 300,
  correctY: 0,
  correctRotation: 0,
  
  // Active state (Canvas space)
  x: 540,
  y: 620,
  rotation: 0,
  
  // Status flags
  placed: false,  // Placed correctly
  locked: false,  // Locked in position
  groupId: null   // Jigsaw connected piece group ID
}
```

> [!CAUTION]
> Never overwrite `correctX` or `correctY` with active draggable `x` or `y` coordinates.

---

## 2. Seeded Randomization & Shuffling

Using a pseudo-random number generator (Mulberry32 or PRNG algorithm) seeded by `seed`:

```js
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }
  
  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
```

Pieces are scattered off-board into the tray area deterministically based on seed values.

---

## 3. Jigsaw Edge & Geometry Model

Internal edges between neighboring pieces $(R, C)$ and $(R, C+1)$ share a single edge relationship definition:

```text
Piece (R, C) RIGHT EDGE  = TAB (+1)
Piece (R, C+1) LEFT EDGE = SLOT (-1)
```

### Shared Edge Model Matrix
For a grid of $R \times C$:
- **Horizontal Edges**: Matrix of size $R \times (C-1)$, where each element is randomly $+1$ (Tab right / Slot left) or $-1$ (Slot right / Tab left).
- **Vertical Edges**: Matrix of size $(R-1) \times C$, where each element is randomly $+1$ (Tab down / Slot up) or $-1$ (Slot down / Tab up).
- **Outer Perimeter**: Flat border ($0$).

### Bezier Curve Parameters
Each Tab/Slot is drawn using standard normalized Bezier anchor points:
```text
(0,0) ---- (0.35, 0) ---- Bezier Tab Curve ---- (0.65, 0) ---- (1,0)
```
Scaling Bezier parameters by piece width/height generates exact smooth interlocking shapes.

---

## 4. Jigsaw Connected Piece Groups

When Jigsaw Piece A snaps to neighboring Piece B:
1. If neither has a `groupId`, a new `groupId` is created containing `[A, B]`.
2. If A has `groupId_1` and B has `groupId_2`, both groups merge into `groupId_1`.
3. Dragging any piece in a group updates active $(x, y)$ coordinates for all member pieces by identical delta $(\Delta x, \Delta y)$.
