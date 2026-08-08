/**
 * PieceAnimations — Spring lerp animations and lock pop feedback
 */
export class PieceAnimations {
  /**
   * Animate piece sprite smoothly to target (correctX, correctY) using lerp ticker
   */
  static animateSnap(sprite, targetX, targetY, onComplete) {
    if (!sprite) return;

    const startX = sprite.x;
    const startY = sprite.y;
    const startTime = performance.now();
    const duration = 200; // ms

    const step = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      sprite.x = startX + (targetX - startX) * ease;
      sprite.y = startY + (targetY - startY) * ease;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        sprite.x = targetX;
        sprite.y = targetY;
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(step);
  }

  /**
   * Subtle scale pop effect when piece locks into place
   */
  static animateLockPop(sprite) {
    if (!sprite) return;

    const startScale = 1.0;
    const popScale = 1.08;
    const startTime = performance.now();
    const duration = 150;

    const step = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      const scale = progress < 0.5
        ? startScale + (popScale - startScale) * (progress * 2)
        : popScale - (popScale - startScale) * ((progress - 0.5) * 2);

      sprite.scale.set(scale);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        sprite.scale.set(1.0);
      }
    };

    requestAnimationFrame(step);
  }
}
