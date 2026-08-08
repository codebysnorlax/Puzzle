/**
 * SeededRandom — Deterministic Mulberry32 PRNG (Pseudo Random Number Generator)
 */
export class SeededRandom {
  constructor(seed) {
    this.seed = typeof seed === 'number' ? seed : this.hashString(String(seed || Date.now()));
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) || 1;
  }

  /**
   * Returns float in [0, 1)
   */
  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns integer in [min, max]
   */
  rangeInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns float in [min, max]
   */
  rangeFloat(min, max) {
    return this.next() * (max - min) + min;
  }
}
