/**
 * PuzzleStatusStore — Tracks puzzle completion & quit/failed statuses in localStorage
 * Statuses: 'completed' (Green Border) | 'quit' (Red Border)
 */
const LS_STATUS_KEY = 'puzzle_completion_statuses';

export class PuzzleStatusStore {
  /**
   * Get dictionary of all puzzle completion statuses
   * @returns {Record<string, 'completed'|'quit'>}
   */
  static getStatuses() {
    try {
      const raw = localStorage.getItem(LS_STATUS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Get completion status for a specific image ID
   * @param {string} imageId 
   * @returns {'completed'|'quit'|null}
   */
  static getStatus(imageId) {
    if (!imageId) return null;
    const statuses = this.getStatuses();
    return statuses[imageId] || null;
  }

  /**
   * Mark a puzzle as successfully completed (Green Border)
   * @param {string} imageId 
   */
  static markCompleted(imageId) {
    if (!imageId) return;
    const statuses = this.getStatuses();
    statuses[imageId] = 'completed';
    try {
      localStorage.setItem(LS_STATUS_KEY, JSON.stringify(statuses));
    } catch (e) {
      console.warn('[PuzzleStatusStore] Failed to save completed status:', e);
    }
  }

  /**
   * Mark a puzzle as started / in-progress (1 Blue Tick, 1 Gray Tick) if not already completed
   * @param {string} imageId 
   */
  static markStarted(imageId) {
    if (!imageId) return;
    const statuses = this.getStatuses();
    if (statuses[imageId] !== 'completed') {
      statuses[imageId] = 'started';
      try {
        localStorage.setItem(LS_STATUS_KEY, JSON.stringify(statuses));
      } catch (e) {
        console.warn('[PuzzleStatusStore] Failed to save started status:', e);
      }
    }
  }

  /**
   * Mark a puzzle as quit/failed (2 Gray Ticks) if not already completed
   * @param {string} imageId 
   */
  static markQuit(imageId) {
    if (!imageId) return;
    const statuses = this.getStatuses();
    // Do not override an already completed puzzle status
    if (statuses[imageId] !== 'completed') {
      statuses[imageId] = 'quit';
      try {
        localStorage.setItem(LS_STATUS_KEY, JSON.stringify(statuses));
      } catch (e) {
        console.warn('[PuzzleStatusStore] Failed to save quit status:', e);
      }
    }
  }

  /**
   * Clear all tracked statuses
   */
  static clearStatuses() {
    localStorage.removeItem(LS_STATUS_KEY);
  }
}
