/**
 * SmartRating — Calculates performance score (1 - 100) based on moves, drag path efficiency, and speed
 */
export function calculateSmartRating({ moveCount = 0, totalDistance = 0, timeSeconds = 0, totalPieces = 16 }) {
  if (moveCount === 0 && totalDistance === 0) return 100;

  // 1. Move Efficiency (50% weight)
  // Theoretical minimum tile swaps = totalPieces / 2
  const minSwaps = Math.max(1, Math.floor(totalPieces / 2));
  const moveRatio = Math.min(1.0, minSwaps / Math.max(minSwaps, moveCount));

  // 2. Drag Path Directness (30% weight)
  // Ideal straight line drag distance ~140px per move
  const idealDistance = Math.max(1, moveCount * 140);
  const dragRatio = totalDistance > 0
    ? Math.min(1.0, idealDistance / Math.max(idealDistance, totalDistance))
    : 1.0;

  // 3. Pace / Speed Ratio (20% weight)
  // Ideal pace ~4 seconds per piece
  const targetSeconds = totalPieces * 4;
  const speedRatio = timeSeconds > 0
    ? Math.min(1.0, targetSeconds / Math.max(targetSeconds, timeSeconds))
    : 1.0;

  // Weighted sum formula
  const weightedScore = (moveRatio * 50) + (dragRatio * 30) + (speedRatio * 20);

  // Clamp rating between 1 and 100
  return Math.max(1, Math.min(100, Math.round(weightedScore)));
}
