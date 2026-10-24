'use client';

/**
 * PolicySnap Audio & Sound Effect Engine (PWA Native Web Audio API)
 * Zero external bandwidth, 100% offline PWA support, zero latency.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmPlaying: boolean = false;
  private bgmIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('policysnap_sound_muted');
      this.isMuted = saved === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      // Safari lama hanya menyediakan versi ber-prefix webkit
      const AudioCtx =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('policysnap_sound_muted', String(this.isMuted));
    }
    if (this.isMuted && this.bgmPlaying) {
      this.stopBgm();
    }
    return this.isMuted;
  }

  /**
   * Sound: Tactile button click / tap
   */
  public playTap() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  /**
   * Sound: Selection / Tab switch (gentle water-drop chime)
   */
  public playSelect() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  /**
   * Sound: Success / Claim XP / Complete Evaluation
   * Ascending 4-tone pleasant melody (C5, E5, G5, C6)
   */
  public playSuccess() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const startTime = ctx.currentTime + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.18);
      });
    } catch {}
  }

  /**
   * Sound: Cute Cat Purr / Meow sound effect
   */
  public playCatMeow() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Chirpy meow frequency curve: 620Hz -> 890Hz -> 540Hz
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(890, ctx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.28);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  }

  /**
   * Background Music (Ambient Cozy Pentatonic generative loop)
   */
  public toggleBgm(): boolean {
    if (this.bgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  public isBgmPlaying(): boolean {
    return this.bgmPlaying;
  }

  private startBgm() {
    if (this.isMuted) this.toggleMute();
    this.bgmPlaying = true;
    const ctx = this.getContext();
    if (!ctx) return;

    // Cozy gentle arpeggio notes (F major pentatonic)
    const chords = [
      [349.23, 440.0, 523.25, 659.25], // F, A, C, E
      [329.63, 392.0, 493.88, 587.33], // E, G, B, D
      [261.63, 329.63, 392.0, 523.25], // C, E, G, C
      [293.66, 349.23, 440.0, 523.25], // D, F, A, C
    ];

    let chordIdx = 0;
    const playChordStep = () => {
      if (!this.bgmPlaying) return;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach((note, nIdx) => {
        const time = ctx.currentTime + nIdx * 0.35;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, time);

        gain.gain.setValueAtTime(0.03, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.9);
      });
    };

    playChordStep();
    this.bgmIntervalId = setInterval(playChordStep, 1600);
  }

  private stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const soundService = new SoundService();
