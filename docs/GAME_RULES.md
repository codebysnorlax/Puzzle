# Image Puzzle PWA — Game Rules Specification

## 1. Game Modes

### Normal Mode (Grid-Based)
- Rectangular pieces dividing the image into an aspect-ratio-aware grid of $R \times C$.
- Pieces can be dragged and placed into board target slots.
- Pieces snap to exact target coordinates when placed within the snap tolerance.

### Jigsaw Mode (Interlocking Pieces)
- Interlocking pieces generated with complementary Bezier tab & slot edges.
- Each edge pair shares an identical mathematical curve (one convex tab, one concave slot).
- Pieces can snap together into connected piece groups prior to being placed in their final correct location on the board.
- Connected groups move as a single combined entity.

---

## 2. Difficulty Configurations

Grid dimensions adapt to the source image's aspect ratio (width/height):

| Difficulty | Target Piece Count | Typical Grid (1:1) | Typical Grid (4:3) | Typical Grid (16:9) |
|---|---|---|---|---|
| **Easy** | ~9 pieces | $3 \times 3$ | $3 \times 3$ | $4 \times 2$ |
| **Normal** | ~16 pieces | $4 \times 4$ | $4 \times 4$ | $5 \times 3$ |
| **Hard** | ~25 pieces | $5 \times 5$ | $5 \times 4$ | $6 \times 4$ |
| **Expert** | ~36 pieces | $6 \times 6$ | $6 \times 6$ | $8 \times 4$ |
| **Extreme** | ~64 pieces | $8 \times 8$ | $8 \times 6$ | $10 \times 6$ |

---

## 3. Anti-Cheat & Seeded Randomization

- Opening a puzzle attempt generates a new random seed ($S$).
- Pieces are randomly scattered across the canvas perimeter/tray using PRNG derived from seed $S$.
- **Anti-Cheat Rule**: Previous active piece arrangements are **never** restored automatically upon reopening a puzzle. Re-entering a puzzle always initiates a fresh randomized arrangement with reset timers and move counters.

---

## 4. Automatic Timer Lifecycle

1. Puzzle loads in `READY` state with timer display showing `00:00`.
2. Movement detection tracks pointer distance on piece drag (`pointermove`).
3. When pointer displacement exceeds a threshold ($\Delta d > 5\text{px}$), game transitions to `RUNNING` state.
4. Timer begins using high-precision `performance.now()`.
5. Display updates smoothly via `requestAnimationFrame`.
6. Upon complete puzzle validation, state transitions to `SOLVED` and timer freezes.

---

## 5. Movement Tracking
- **`moveCount`**: Incremented by +1 on each completed pointer drop (`pointerup`) where displacement $> 0$.
- **`totalDistance`**: Accumulated Euclidean pixel movement $\sum \sqrt{\Delta x^2 + \Delta y^2}$ during piece drags.

---

## 6. Completion Detection & Snap Rules

- **Snap Threshold**: When piece center is within $D_{\text{snap}}$ pixels of its correct position (or complementary piece edge), piece snaps to exact target coordinates and locks.
- **Validation**: Puzzle is solved if and only if **every** piece $i$ satisfies:
  $$\| (x_i, y_i) - (x_i^{\text{correct}}, y_i^{\text{correct}}) \| < \epsilon \quad \text{and} \quad \theta_i = \theta_i^{\text{correct}}$$
- Validation is determined strictly from internal mathematical data structures, never visual canvas comparison.
