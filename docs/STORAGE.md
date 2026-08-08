# Image Puzzle PWA — Storage Architecture

## 1. Storage Strategy Overview

The PWA follows a strict local-first data architecture.

```text
┌─────────────────────────────────────────────────────────────┐
│                       localStorage                          │
│   • Theme preferences (light/dark)                          │
│   • Sound preferences (enabled/muted)                       │
│   • Last selected difficulty & game mode                    │
│   • Aggregate statistics (total solved, best times)         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    IndexedDB (PuzzleDB)                     │
│   • Store: `images`       -> User uploaded image Blobs      │
│   • Store: `history`      -> Detailed match result records  │
│   • Store: `savedPuzzles` -> Cached puzzle metadata         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. IndexedDB Schema Specification

- **Database Name**: `PuzzleDB`
- **Database Version**: `1`

### Store 1: `images`
- **Key Path**: `id` (string, generated UUID or timestamp)
- **Indexes**:
  - `createdAt` (integer timestamp)
  - `name` (string)

```typescript
interface UserImageRecord {
  id: string;
  blob: Blob;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  createdAt: number;
}
```

> [!IMPORTANT]
> User images must **never** be stored as Base64 strings in `localStorage`. They are stored strictly as binary `Blob` objects inside IndexedDB.

---

### Store 2: `history`
- **Key Path**: `id` (auto-increment string or UUID)
- **Indexes**:
  - `imageId` (string)
  - `mode` (string: `'normal'` | `'jigsaw'`)
  - `completedAt` (number timestamp)

```typescript
interface GameHistoryRecord {
  id: string;
  imageId: string;
  imageName: string;
  mode: 'normal' | 'jigsaw';
  difficulty: 'easy' | 'normal' | 'hard' | 'expert' | 'extreme';
  pieceCount: number;
  timeMs: number;
  moveCount: number;
  totalDistance: number;
  completedAt: number;
  seed: string;
}
```

---

### Store 3: `savedPuzzles`
- **Key Path**: `id`
- Stores puzzle configurations and metadata (not active piece positions, as anti-cheat requires fresh random shuffles on new attempts).

---

## 3. Storage Quota & Error Handling
- IndexedDB storage failure, quota overflow, or persistent mode denial is handled gracefully with user notifications.
- Oversized uploaded images are downsampled before saving blob into IndexedDB to conserve storage footprint.
