/**
 * Timer — High precision game clock using performance.now() and requestAnimationFrame
 */
export class Timer {
  constructor(onTick) {
    this.onTick = onTick;
    this.startTime = 0;
    this.elapsedMs = 0;
    this.isRunning = false;
    this.rafId = null;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = performance.now() - this.elapsedMs;
    this.tick();
  }

  tick() {
    if (!this.isRunning) return;

    this.elapsedMs = performance.now() - this.startTime;
    const formatted = this.getFormattedTime();

    if (this.onTick) {
      this.onTick(formatted, this.elapsedMs);
    }

    this.rafId = requestAnimationFrame(() => this.tick());
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    return this.elapsedMs;
  }

  reset() {
    this.stop();
    this.elapsedMs = 0;
    if (this.onTick) {
      this.onTick('00:00', 0);
    }
  }

  getFormattedTime() {
    const totalSeconds = Math.floor(this.elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}
