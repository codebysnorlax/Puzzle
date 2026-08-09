/**
 * SettingsStore — Manages UI preferences and theme persistence in localStorage
 */
const SETTINGS_KEY = 'pixelcraft_pwa_settings';

const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark'
  sound: true,
  snapSensitivity: 'normal', // 'strict' (15px), 'normal' (25px), 'relaxed' (40px)
  lastDifficulty: 'normal',
  lastMode: 'normal'
};

export class SettingsStore {
  static getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.warn('[SettingsStore] Failed to read settings from localStorage', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  static saveSettings(settings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      if (updated.theme) {
        this.applyTheme(updated.theme);
      }
      return updated;
    } catch (e) {
      console.warn('[SettingsStore] Failed to write settings to localStorage', e);
      return DEFAULT_SETTINGS;
    }
  }

  static applyTheme(theme) {
    const activeTheme = theme || this.getSettings().theme || 'light';
    document.documentElement.setAttribute('data-theme', activeTheme);
    return activeTheme;
  }

  static getSnapThreshold() {
    const settings = this.getSettings();
    switch (settings.snapSensitivity) {
      case 'strict': return 15;
      case 'relaxed': return 40;
      case 'normal':
      default: return 25;
    }
  }
}
