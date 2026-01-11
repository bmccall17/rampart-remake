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
   * Critical hit sound - satisfying high-pitched impact with reverb
   */
  playCriticalHit(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // High-pitched impact "ping"
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.15);

    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 0.2);

    // Secondary harmonic for "crunch"
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();

    osc2.type = "square";
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    gain2.gain.setValueAtTime(0.25, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start(now);
    osc2.stop(now + 0.12);

    // Quick noise burst for punch
    this.playNoiseShot(0.06, 0.3);
  }

  /**
   * Ship explosion sound - rumbling explosion with multiple layers
   * Pitch varies by ship type: scouts higher, destroyers lower
   */
  playShipExplosion(shipType: string = "frigate"): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    // Pitch multiplier based on ship type (higher = smaller ship)
    const pitchMult = shipType === "scout" ? 1.5 : shipType === "destroyer" ? 0.7 : 1.0;
    const volumeMult = shipType === "scout" ? 0.7 : shipType === "destroyer" ? 1.2 : 1.0;
    const durationMult = shipType === "scout" ? 0.7 : shipType === "destroyer" ? 1.3 : 1.0;

    const now = this.audioContext.currentTime;

    // Low rumble
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(80 * pitchMult, now);
    osc1.frequency.exponentialRampToValueAtTime(30 * pitchMult, now + 0.4 * durationMult);

    gain1.gain.setValueAtTime(0.5 * volumeMult, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5 * durationMult);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 0.5 * durationMult);

    // Mid-range crackle
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();

    osc2.type = "square";
    osc2.frequency.setValueAtTime(200 * pitchMult, now);
    osc2.frequency.exponentialRampToValueAtTime(60 * pitchMult, now + 0.3 * durationMult);

    gain2.gain.setValueAtTime(0.3 * volumeMult, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35 * durationMult);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start(now);
    osc2.stop(now + 0.35 * durationMult);

    // Extended noise for debris
    this.playNoiseShot(0.4 * durationMult, 0.5 * volumeMult);
  }

  /**
   * Ship hit sound - wood crashing/cracking impact
   * Played when player cannonball hits a ship but doesn't destroy it
   */
  playShipHit(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Wood cracking sound (high-frequency attack)
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(400, now);
    osc1.frequency.exponentialRampToValueAtTime(100, now + 0.1);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 0.15);

    // Low thud component
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(150, now);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.12);

    gain2.gain.setValueAtTime(0.35, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start(now);
    osc2.stop(now + 0.15);

    // Short noise for impact texture
    this.playNoiseShot(0.08, 0.3);
  }

  /**
   * Wall fire sound - crackling flames with stone crumble
   */
  playWallFire(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Stone crumble (low)
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();

    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(50, now + 0.2);

    gain1.gain.setValueAtTime(0.45, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 0.25);

    // Fire crackle (noise with filter)
    const bufferSize = this.audioContext.sampleRate * 0.4;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Create crackling pattern with random bursts
      const burst = Math.random() > 0.9 ? 1.5 : 1;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.6)) * burst;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 1;

    const gain2 = this.audioContext.createGain();
    gain2.gain.setValueAtTime(0.35, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    source.connect(filter);
    filter.connect(gain2);
    gain2.connect(this.masterGain);

    source.start(now);
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
   * Boss spawn sound - ominous horn blast
   */
  playBossSpawn(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Deep horn blast
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.linearRampToValueAtTime(100, now + 0.3);
    osc1.frequency.linearRampToValueAtTime(80, now + 0.8);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gain1.gain.setValueAtTime(0.5, now + 0.5);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 1.0);

    // Second harmonic for fullness
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(160, now);
    osc2.frequency.linearRampToValueAtTime(200, now + 0.3);
    osc2.frequency.linearRampToValueAtTime(160, now + 0.8);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain2.gain.setValueAtTime(0.25, now + 0.5);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start(now);
    osc2.stop(now + 1.0);
  }

  /**
   * Boss destruction sound - massive explosion with reverb
   */
  playBossExplosion(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Very low rumble
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(60, now);
    osc1.frequency.exponentialRampToValueAtTime(20, now + 0.8);

    gain1.gain.setValueAtTime(0.7, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 1.0);

    // Mid crackle
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();

    osc2.type = "square";
    osc2.frequency.setValueAtTime(300, now);
    osc2.frequency.exponentialRampToValueAtTime(40, now + 0.5);

    gain2.gain.setValueAtTime(0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc2.start(now);
    osc2.stop(now + 0.6);

    // Extended noise debris
    this.playNoiseShot(0.8, 0.6);

    // Secondary explosion echo
    setTimeout(() => {
      if (!this.audioContext || !this.masterGain) return;
      const echoNow = this.audioContext.currentTime;

      const echoOsc = this.audioContext.createOscillator();
      const echoGain = this.audioContext.createGain();

      echoOsc.type = "triangle";
      echoOsc.frequency.setValueAtTime(100, echoNow);
      echoOsc.frequency.exponentialRampToValueAtTime(30, echoNow + 0.4);

      echoGain.gain.setValueAtTime(0.3, echoNow);
      echoGain.gain.exponentialRampToValueAtTime(0.01, echoNow + 0.5);

      echoOsc.connect(echoGain);
      echoGain.connect(this.masterGain);

      echoOsc.start(echoNow);
      echoOsc.stop(echoNow + 0.5);
    }, 200);
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
