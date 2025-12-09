// Web Audio API based game sounds
// Generates sounds programmatically without external audio files

const STORAGE_KEY = 'aula-click-sound-preferences';

const getPreferences = () => {
  if (typeof window === 'undefined') return { enabled: true, volume: 0.7, feedbackSounds: true, navigationSounds: true, celebrationSounds: true };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return { enabled: true, volume: 0.7, feedbackSounds: true, navigationSounds: true, celebrationSounds: true };
};

class GameSounds {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private isEnabled(type: 'feedback' | 'navigation' | 'celebration' = 'feedback'): boolean {
    const prefs = getPreferences();
    if (!prefs.enabled) return false;
    
    switch (type) {
      case 'feedback': return prefs.feedbackSounds !== false;
      case 'navigation': return prefs.navigationSounds !== false;
      case 'celebration': return prefs.celebrationSounds !== false;
      default: return true;
    }
  }

  private getVolume(): number {
    const prefs = getPreferences();
    return prefs.volume ?? 0.7;
  }

  // Correct answer sound - cheerful ascending notes
  playCorrect() {
    if (!this.isEnabled('feedback')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();

    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.1);
      
      gainNode.gain.setValueAtTime(0, now + index * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.3 * vol, now + index * 0.1 + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + index * 0.1 + 0.3);
      
      oscillator.start(now + index * 0.1);
      oscillator.stop(now + index * 0.1 + 0.35);
    });
  }

  // Incorrect answer sound - descending buzzer
  playIncorrect() {
    if (!this.isEnabled('feedback')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.linearRampToValueAtTime(100, now + 0.3);
    
    gainNode.gain.setValueAtTime(0.2 * vol, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.35);
  }

  // Level up fanfare
  playLevelUp() {
    if (!this.isEnabled('celebration')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const frequencies = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    
    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.08);
      
      gainNode.gain.setValueAtTime(0, now + index * 0.08);
      gainNode.gain.linearRampToValueAtTime(0.25 * vol, now + index * 0.08 + 0.05);
      gainNode.gain.linearRampToValueAtTime(index === frequencies.length - 1 ? 0.15 * vol : 0, now + index * 0.08 + 0.4);
      
      oscillator.start(now + index * 0.08);
      oscillator.stop(now + index * 0.08 + 0.5);
    });

    setTimeout(() => {
      const chordFreqs = [523.25, 659.25, 783.99];
      chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.15 * vol, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.1);
      });
    }, 600);
  }

  // Achievement unlock sound
  playAchievement() {
    if (!this.isEnabled('celebration')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const frequencies = [880, 1108.73, 1318.51, 1760];
    
    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now);
      oscillator.frequency.setValueAtTime(freq * 1.02, now + 0.1);
      oscillator.frequency.setValueAtTime(freq, now + 0.2);
      
      gainNode.gain.setValueAtTime(0, now + index * 0.05);
      gainNode.gain.linearRampToValueAtTime(0.2 * vol, now + index * 0.05 + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + index * 0.05 + 0.5);
      
      oscillator.start(now + index * 0.05);
      oscillator.stop(now + index * 0.05 + 0.55);
    });
  }

  // Celebration/Perfect score sound
  playCelebration() {
    if (!this.isEnabled('celebration')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const melody = [
      { freq: 523.25, start: 0, duration: 0.15 },
      { freq: 587.33, start: 0.15, duration: 0.15 },
      { freq: 659.25, start: 0.3, duration: 0.15 },
      { freq: 783.99, start: 0.45, duration: 0.3 },
      { freq: 659.25, start: 0.75, duration: 0.15 },
      { freq: 783.99, start: 0.9, duration: 0.5 },
    ];
    
    melody.forEach(note => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(note.freq, now + note.start);
      
      gainNode.gain.setValueAtTime(0, now + note.start);
      gainNode.gain.linearRampToValueAtTime(0.25 * vol, now + note.start + 0.03);
      gainNode.gain.linearRampToValueAtTime(0.2 * vol, now + note.start + note.duration * 0.8);
      gainNode.gain.linearRampToValueAtTime(0, now + note.start + note.duration);
      
      oscillator.start(now + note.start);
      oscillator.stop(now + note.start + note.duration + 0.05);
    });

    const harmony = [
      { freq: 392.00, start: 0.45, duration: 0.3 },
      { freq: 493.88, start: 0.9, duration: 0.5 },
    ];
    
    harmony.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      
      gain.gain.setValueAtTime(0.1 * vol, now + note.start);
      gain.gain.linearRampToValueAtTime(0, now + note.start + note.duration);
      
      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.05);
    });
  }

  // Streak sound
  playStreak() {
    if (!this.isEnabled('celebration')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.4);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15 * vol, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
    
    oscillator.start(now);
    oscillator.stop(now + 0.45);

    [1200, 1600, 2000].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      
      gain.gain.setValueAtTime(0.05 * vol, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.05 + 0.2);
      
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.25);
    });
  }

  // Click/tap feedback - soft pop
  playClick() {
    if (!this.isEnabled('navigation')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    
    gainNode.gain.setValueAtTime(0.08 * vol, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  // Button hover sound - subtle tick
  playHover() {
    if (!this.isEnabled('navigation')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, now);
    
    gainNode.gain.setValueAtTime(0.03 * vol, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    oscillator.start(now);
    oscillator.stop(now + 0.04);
  }

  // Navigation/page transition - whoosh
  playNavigation() {
    if (!this.isEnabled('navigation')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    // Noise-like whoosh using filtered noise
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    
    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
    filter.Q.value = 1;
    
    gainNode.gain.setValueAtTime(0.1 * vol, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    noise.start(now);
    noise.stop(now + 0.2);
  }

  // Tab switch sound
  playTabSwitch() {
    if (!this.isEnabled('navigation')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.setValueAtTime(800, now + 0.05);
    
    gainNode.gain.setValueAtTime(0.06 * vol, now);
    gainNode.gain.linearRampToValueAtTime(0.08 * vol, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  // Modal open sound
  playModalOpen() {
    if (!this.isEnabled('navigation')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    [400, 600].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      
      gain.gain.setValueAtTime(0.1 * vol, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
      
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }

  // Modal close sound
  playModalClose() {
    if (!this.isEnabled('navigation')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    [600, 400].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      
      gain.gain.setValueAtTime(0.08 * vol, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.12);
      
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.15);
    });
  }

  // Success/submit sound
  playSuccess() {
    if (!this.isEnabled('feedback')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 major arpeggio
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15 * vol, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  }

  // Error/warning sound
  playError() {
    if (!this.isEnabled('feedback')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    [200, 180].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      
      gain.gain.setValueAtTime(0.1 * vol, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.12);
      
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.15);
    });
  }

  // Notification pop sound
  playNotification() {
    if (!this.isEnabled('feedback')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1100, now + 0.08);
    osc.frequency.setValueAtTime(880, now + 0.16);
    
    gain.gain.setValueAtTime(0.12 * vol, now);
    gain.gain.setValueAtTime(0.15 * vol, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Typing/keyboard sound
  playType() {
    if (!this.isEnabled('navigation')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const freq = 800 + Math.random() * 400;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0.02 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // XP gain sound
  playXPGain() {
    if (!this.isEnabled('feedback')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    
    gain.gain.setValueAtTime(0.1 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Coin/collect sound
  playCoin() {
    if (!this.isEnabled('feedback')) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const vol = this.getVolume();
    
    [1000, 1500].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      
      gain.gain.setValueAtTime(0.12 * vol, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.2);
    });
  }
}

// Singleton instance
export const gameSounds = new GameSounds();

// Hook for React components
import { useCallback } from 'react';

export const useGameSounds = () => {
  const playCorrect = useCallback(() => gameSounds.playCorrect(), []);
  const playIncorrect = useCallback(() => gameSounds.playIncorrect(), []);
  const playLevelUp = useCallback(() => gameSounds.playLevelUp(), []);
  const playAchievement = useCallback(() => gameSounds.playAchievement(), []);
  const playCelebration = useCallback(() => gameSounds.playCelebration(), []);
  const playStreak = useCallback(() => gameSounds.playStreak(), []);
  const playClick = useCallback(() => gameSounds.playClick(), []);
  const playHover = useCallback(() => gameSounds.playHover(), []);
  const playNavigation = useCallback(() => gameSounds.playNavigation(), []);
  const playTabSwitch = useCallback(() => gameSounds.playTabSwitch(), []);
  const playModalOpen = useCallback(() => gameSounds.playModalOpen(), []);
  const playModalClose = useCallback(() => gameSounds.playModalClose(), []);
  const playSuccess = useCallback(() => gameSounds.playSuccess(), []);
  const playError = useCallback(() => gameSounds.playError(), []);
  const playNotification = useCallback(() => gameSounds.playNotification(), []);
  const playType = useCallback(() => gameSounds.playType(), []);
  const playXPGain = useCallback(() => gameSounds.playXPGain(), []);
  const playCoin = useCallback(() => gameSounds.playCoin(), []);

  return {
    playCorrect,
    playIncorrect,
    playLevelUp,
    playAchievement,
    playCelebration,
    playStreak,
    playClick,
    playHover,
    playNavigation,
    playTabSwitch,
    playModalOpen,
    playModalClose,
    playSuccess,
    playError,
    playNotification,
    playType,
    playXPGain,
    playCoin
  };
};
