import { SettingsStore } from '../storage/SettingsStore.js';

/**
 * SoundEffects — Audio Manager for move.wav and win.wav sound effects
 */
class SoundEffectsManager {
  constructor() {
    this.moveAudio = new Audio('./assets/audio/move.wav');
    this.winAudio = new Audio('./assets/audio/win.wav');
    this.toastAudio = new Audio('./assets/audio/showTost.wav');

    this.moveAudio.preload = 'auto';
    this.winAudio.preload = 'auto';
    this.toastAudio.preload = 'auto';
  }

  /**
   * Check if sound effects are enabled in user settings
   * @returns {boolean}
   */
  isSoundEnabled() {
    const settings = SettingsStore.getSettings();
    return settings.sound !== false;
  }

  /**
   * Play move.wav sound effect on piece pick/drag/move/place
   */
  playMoveSound() {
    if (!this.isSoundEnabled()) return;
    try {
      // Clone audio node to allow overlapping playback for fast piece movements
      const sound = this.moveAudio.cloneNode();
      sound.volume = 0.7;
      sound.play().catch(() => {
        // Suppress browser autoplay restrictions if user has not interacted yet
      });
    } catch (e) {
      console.warn('[SoundEffects] playMoveSound failed:', e);
    }
  }

  /**
   * Play win.wav victory sound effect on puzzle completion
   */
  playWinSound() {
    if (!this.isSoundEnabled()) return;
    try {
      this.winAudio.currentTime = 0;
      this.winAudio.volume = 0.95;
      this.winAudio.play().catch((err) => {
        console.warn('[SoundEffects] playWinSound failed:', err);
      });
    } catch (e) {
      console.warn('[SoundEffects] playWinSound failed:', e);
    }
  }

  playToastSound() {
    if (!this.isSoundEnabled()) return;
    try {
      this.toastAudio.currentTime = 0;
      this.toastAudio.volume = 0.5;
      this.toastAudio.play().catch((err) => {
        console.warn('[SoundEffects] playToastSound failed:', err);
      });
    } catch (e) {
      console.warn('[SoundEffects] playToastSound failed:', e);
    }
  }
}

export const SoundEffects = new SoundEffectsManager();
