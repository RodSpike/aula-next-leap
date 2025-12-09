// Web Audio API based game sounds
// Generates sounds programmatically without external audio files

class GameSounds {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Correct answer sound - cheerful ascending notes
  playCorrect() {
    if (!this.isEnabled) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Play three ascending notes
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.1);
      
      gainNode.gain.setValueAtTime(0, now + index * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.3, now + index * 0.1 + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + index * 0.1 + 0.3);
      
      oscillator.start(now + index * 0.1);
      oscillator.stop(now + index * 0.1 + 0.35);
    });
  }

  // Incorrect answer sound - descending buzzer
  playIncorrect() {
    if (!this.isEnabled) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.linearRampToValueAtTime(100, now + 0.3);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.35);
  }

  // Level up fanfare
  playLevelUp() {
    if (!this.isEnabled) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Triumphant fanfare - ascending arpeggio
    const frequencies = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4 to C6
    
    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.08);
      
      gainNode.gain.setValueAtTime(0, now + index * 0.08);
      gainNode.gain.linearRampToValueAtTime(0.25, now + index * 0.08 + 0.05);
      gainNode.gain.linearRampToValueAtTime(index === frequencies.length - 1 ? 0.15 : 0, now + index * 0.08 + 0.4);
      
      oscillator.start(now + index * 0.08);
      oscillator.stop(now + index * 0.08 + 0.5);
    });

    // Add final chord
    setTimeout(() => {
      const chordFreqs = [523.25, 659.25, 783.99]; // C5, E5, G5 major chord
      chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.1);
      });
    }, 600);
  }

  // Achievement unlock sound
  playAchievement() {
    if (!this.isEnabled) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Magical sparkle sound
    const frequencies = [880, 1108.73, 1318.51, 1760]; // A5, C#6, E6, A6
    
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
      gainNode.gain.linearRampToValueAtTime(0.2, now + index * 0.05 + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + index * 0.05 + 0.5);
      
      oscillator.start(now + index * 0.05);
      oscillator.stop(now + index * 0.05 + 0.55);
    });
  }

  // Celebration/Perfect score sound
  playCelebration() {
    if (!this.isEnabled) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Play a happy jingle
    const melody = [
      { freq: 523.25, start: 0, duration: 0.15 },      // C5
      { freq: 587.33, start: 0.15, duration: 0.15 },   // D5
      { freq: 659.25, start: 0.3, duration: 0.15 },    // E5
      { freq: 783.99, start: 0.45, duration: 0.3 },    // G5
      { freq: 659.25, start: 0.75, duration: 0.15 },   // E5
      { freq: 783.99, start: 0.9, duration: 0.5 },     // G5 (held)
    ];
    
    melody.forEach(note => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(note.freq, now + note.start);
      
      gainNode.gain.setValueAtTime(0, now + note.start);
      gainNode.gain.linearRampToValueAtTime(0.25, now + note.start + 0.03);
      gainNode.gain.linearRampToValueAtTime(0.2, now + note.start + note.duration * 0.8);
      gainNode.gain.linearRampToValueAtTime(0, now + note.start + note.duration);
      
      oscillator.start(now + note.start);
      oscillator.stop(now + note.start + note.duration + 0.05);
    });

    // Add harmony on final notes
    const harmony = [
      { freq: 392.00, start: 0.45, duration: 0.3 },   // G4
      { freq: 493.88, start: 0.9, duration: 0.5 },    // B4
    ];
    
    harmony.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      
      gain.gain.setValueAtTime(0.1, now + note.start);
      gain.gain.linearRampToValueAtTime(0, now + note.start + note.duration);
      
      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.05);
    });
  }

  // Streak sound
  playStreak() {
    if (!this.isEnabled) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Fire/whoosh sound
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
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
    
    oscillator.start(now);
    oscillator.stop(now + 0.45);

    // Add sparkle overlay
    [1200, 1600, 2000].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      
      gain.gain.setValueAtTime(0.05, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.05 + 0.2);
      
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.25);
    });
  }

  // Click/tap feedback
  playClick() {
    if (!this.isEnabled) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, now);
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
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
  const setEnabled = useCallback((enabled: boolean) => gameSounds.setEnabled(enabled), []);

  return {
    playCorrect,
    playIncorrect,
    playLevelUp,
    playAchievement,
    playCelebration,
    playStreak,
    playClick,
    setEnabled
  };
};
