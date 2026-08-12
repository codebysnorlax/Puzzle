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
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5 note
        osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12); // slides up to E6

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1109.73, now); // C#6 note
        osc2.frequency.exponentialRampToValueAtTime(1661.22, now + 0.12); // slides up to G#6

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 0.02); // gentle volume ramp
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35); // fast decay

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);

        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
      } else {
        const sound = this.toastAudio.cloneNode();
        sound.volume = 0.5;
        sound.play().catch(() => {});
      }
    } catch (e) {
      console.warn('[SoundEffects] playToastSound failed, using fallback:', e);
      try {
        const sound = this.toastAudio.cloneNode();
        sound.volume = 0.5;
        sound.play().catch(() => {});
      } catch (err) {}
    }
  }
}

export const SoundEffects = new SoundEffectsManager();
