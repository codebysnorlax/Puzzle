/**
 * VisitorTracker — Real user Unique & Total/Frequent Visitor analytics client service.
 * Interacts with Cloudflare Pages / Workers API endpoint /api/stats.
 * Uses IP-based hash stored in localStorage to prevent duplicate visits.
 */
const VISITOR_ID_KEY = 'pixelcraft_visitor_id_v3';
const LOCAL_STATS_KEY = 'pixelcraft_visitor_stats_v3';

/**
 * Simple hash function to create consistent hash from string
 * @param {string} str 
 * @returns {string}
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export class VisitorTracker {
  /**
   * Format numbers to compact strings (e.g. 1000 -> "1k", 1500 -> "1.5k", 1000000 -> "1M")
   * @param {number} num 
   * @returns {string}
   */
  static formatCount(num) {
    const val = Number(num) || 0;
    if (val < 1000) return val.toString();
    if (val < 1000000) {
      const k = (val / 1000).toFixed(1).replace(/\.0$/, '');
      return `${k}k`;
    }
    const m = (val / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${m}M`;
  }

  /**
   * Record visit and fetch real Unique & Total visitor statistics along with device metadata
   * Uses IP-based hash from server to create consistent visitor ID
   * @returns {Promise<{ unique: number, total: number, uniqueFormatted: string, totalFormatted: string }>}
   */
  static async recordAndGetStats() {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    let isNewVisitor = false;

    // Collect device metadata
    const language = navigator.language || 'en';
    const screen = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '';
    let timezone = '';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (e) {}

    try {
      // First, get IP hash from server if we don't have a visitor ID
      if (!visitorId) {
        const ipResponse = await fetch('/api/stats?action=get_ip_hash');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          visitorId = ipData.visitorId;
          
          // Check if this visitor ID already exists in localStorage
          const existingId = localStorage.getItem(VISITOR_ID_KEY);
          if (!existingId) {
            localStorage.setItem(VISITOR_ID_KEY, visitorId);
            isNewVisitor = true;
          }
        }
      }

      // If still no visitor ID (offline mode), generate one
      if (!visitorId) {
        visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
        isNewVisitor = true;
      }

      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          isNewVisitor,
          language,
          screen,
          timezone
        })
      });

      if (response.ok) {
        const data = await response.json();
        const stats = {
          unique: data.unique || (isNewVisitor ? 1 : 0),
          total: data.total || 1,
          uniqueFormatted: this.formatCount(data.unique || (isNewVisitor ? 1 : 0)),
          totalFormatted: this.formatCount(data.total || 1)
        };
        localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
        return stats;
      }
    } catch (err) {
      console.warn('[VisitorTracker] API fetch offline/dev mode, using local tracking:', err);
    }

    // Local tracking fallback for dev server (starts from 0 for real visitors)
    let stored = {};
    try {
      const raw = localStorage.getItem(LOCAL_STATS_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch (e) {}

    const localTotal = (stored.total || 0) + 1;
    const localUnique = (stored.unique || 0) + (isNewVisitor ? 1 : 0);

    const fallbackStats = {
      unique: localUnique,
      total: localTotal,
      uniqueFormatted: this.formatCount(localUnique),
      totalFormatted: this.formatCount(localTotal)
    };

    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(fallbackStats));
    return fallbackStats;
  }

  /**
   * Helper to trigger smooth text update animation on a DOM element
   * @param {HTMLElement} element 
   * @param {string} newText 
   */
  static updateElementWithAnimation(element, newText) {
    if (!element) return;
    if (element.textContent === newText) return;

    element.textContent = newText;
    element.classList.remove('updating');
    // Force reflow
    void element.offsetWidth;
    element.classList.add('updating');
    setTimeout(() => {
      element.classList.remove('updating');
    }, 500);
  }
}
