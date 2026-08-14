/**
 * SettingsStore — Manages UI preferences and theme persistence in localStorage
 */
const SETTINGS_KEY = 'pixelcraft_pwa_settings';

const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark'
  sound: true,
  snapSensitivity: 'normal', // 'strict' (15px), 'normal' (25px), 'relaxed' (40px)
  lastDifficulty: 'normal',
  lastMode: 'normal',
  borderColor: '#64748b'
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

    // Dynamically sync theme-color meta tag with browser URL bar & mobile status bar
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    const color = activeTheme === 'dark' ? '#0f172a' : '#f7f6f2';
    metaThemeColor.setAttribute('content', color);

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
