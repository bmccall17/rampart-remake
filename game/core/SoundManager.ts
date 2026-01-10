/**
 * SoundManager - Programmatic audio using Web Audio API
 * Generates retro-style sound effects without external audio files
 */

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // Master volume
      this.masterGain.connect(this.audioContext.destination);
    } catch {
      console.warn("Web Audio API not supported");
      this.enabled = false;
    }
  }

  /**
   * Resume audio context (required after user interaction)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Toggle sound on/off
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Cannon fire sound - low boom with short decay
   */
  playCannonFire(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Main cannon boom (low frequency)
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);

    // Add noise burst for "punch"
    this.playNoiseShot(0.08, 0.4);
  }

  /**
   * Ship explosion sound - rumbling explosion with multiple layers
   */
  playShipExplosion(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Low rumble
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 0.5);

    // Mid-range crackle
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();

    osc2.type = "square";
    osc2.frequency.setValueAtTime(200, now);
    osc2.frequency.exponentialRampToValueAtTime(60, now + 0.3);

    gain2.gain.setValueAtTime(0.3, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start(now);
    osc2.stop(now + 0.35);

    // Extended noise for debris
    this.playNoiseShot(0.4, 0.5);
  }

  /**
   * Terrain impact sound - short thud
   */
  playTerrainImpact(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Impact thud
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);

    // Short noise burst
    this.playNoiseShot(0.05, 0.25);
  }

  /**
   * Water splash sound - high-frequency noise with quick fade
   */
  playWaterSplash(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // High-pass filtered noise for splash
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 2000;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
  }

  /**
   * Phase transition sound - rising tone
   */
  playPhaseTransition(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Rising tone
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Wall piece placement sound - short click
   */
  playPiecePlacement(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Cannon placement sound - metallic clunk
   */
  playCannonPlacement(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Low thunk
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();

    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 0.15);

    // Metallic ping
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.1);

    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start(now);
    osc2.stop(now + 0.12);
  }

  /**
   * Victory jingle - ascending arpeggio
   */
  playVictory(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const noteDuration = 0.15;

    notes.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * noteDuration);

      const noteStart = now + index * noteDuration;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.3, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
  }

  /**
   * Defeat sound - descending sad tones
   */
  playDefeat(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const notes = [392.0, 349.23, 329.63, 261.63]; // G4, F4, E4, C4 (sad descent)
    const noteDuration = 0.25;

    notes.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + index * noteDuration);

      const noteStart = now + index * noteDuration;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.25, noteStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration * 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
  }

  /**
   * Helper: Play a noise burst
   */
  private playNoiseShot(duration: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    source.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
