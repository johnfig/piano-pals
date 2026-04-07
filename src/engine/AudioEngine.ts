import { MidiNote } from '@/types/game';
import { midiNoteToFrequency } from '@/constants/keyboard';

export type InstrumentType = 'piano' | 'electric';

interface ActiveVoice {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  velocity: number;
}

class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;
  private instrument: InstrumentType = 'piano';

  // Track active sustained notes for key-up release
  private activeVoices: Map<MidiNote, ActiveVoice> = new Map();

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  init(): void {
    if (this.initialized) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || !this.masterGain) {
      throw new Error('AudioEngine not initialized. Call init() on a user gesture first.');
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setInstrument(type: InstrumentType): void {
    this.instrument = type;
  }

  getInstrument(): InstrumentType {
    return this.instrument;
  }

  /**
   * Start a sustained note that plays until stopNote() is called.
   * Sound varies based on selected instrument.
   */
  startNote(midiNote: MidiNote, velocity: number = 100): void {
    this.stopNote(midiNote);

    if (this.instrument === 'electric') {
      this.startNoteElectric(midiNote, velocity);
    } else {
      this.startNotePiano(midiNote, velocity);
    }
  }

  /** Acoustic piano: sawtooth + triangle + sine harmonic */
  private startNotePiano(midiNote: MidiNote, velocity: number): void {
    const ctx = this.ensureContext();
    const freq = midiNoteToFrequency(midiNote);
    const now = ctx.currentTime;

    const velScale = Math.max(0.2, velocity / 127);
    const attack = 0.005;
    const decay = 0.3;
    const sustainLevel = 0.4;

    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Layer 1: Sawtooth (body)
    const saw = ctx.createOscillator();
    const sawGain = ctx.createGain();
    saw.type = 'sawtooth';
    saw.frequency.value = freq;
    saw.detune.value = -5;
    const sawVol = 0.08 * velScale;
    sawGain.gain.setValueAtTime(0, now);
    sawGain.gain.linearRampToValueAtTime(sawVol, now + attack);
    sawGain.gain.linearRampToValueAtTime(sawVol * sustainLevel, now + attack + decay);
    saw.connect(sawGain);
    sawGain.connect(this.masterGain!);
    saw.start(now);
    oscillators.push(saw);
    gains.push(sawGain);

    // Layer 2: Triangle (main tone)
    const tri = ctx.createOscillator();
    const triGain = ctx.createGain();
    tri.type = 'triangle';
    tri.frequency.value = freq;
    tri.detune.value = 3;
    const triVol = 0.25 * velScale;
    triGain.gain.setValueAtTime(0, now);
    triGain.gain.linearRampToValueAtTime(triVol, now + attack);
    triGain.gain.linearRampToValueAtTime(triVol * sustainLevel, now + attack + decay);
    tri.connect(triGain);
    triGain.connect(this.masterGain!);
    tri.start(now);
    oscillators.push(tri);
    gains.push(triGain);

    // Layer 3: Sine harmonic (brightness)
    const sine = ctx.createOscillator();
    const sineGain = ctx.createGain();
    sine.type = 'sine';
    sine.frequency.value = freq * 2;
    const sineVol = 0.12 * velScale;
    sineGain.gain.setValueAtTime(0, now);
    sineGain.gain.linearRampToValueAtTime(sineVol, now + attack);
    sineGain.gain.linearRampToValueAtTime(sineVol * sustainLevel, now + attack + decay);
    sine.connect(sineGain);
    sineGain.connect(this.masterGain!);
    sine.start(now);
    oscillators.push(sine);
    gains.push(sineGain);

    this.activeVoices.set(midiNote, { oscillators, gains, velocity });
  }

  /** Electric piano (Rhodes-like): warm sine layers with tremolo */
  private startNoteElectric(midiNote: MidiNote, velocity: number): void {
    const ctx = this.ensureContext();
    const freq = midiNoteToFrequency(midiNote);
    const now = ctx.currentTime;

    const velScale = Math.max(0.2, velocity / 127);
    const attack = 0.01;
    const decay = 0.5;
    const sustainLevel = 0.5;

    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Layer 1: Sine fundamental (warm base)
    const sine1 = ctx.createOscillator();
    const sine1Gain = ctx.createGain();
    sine1.type = 'sine';
    sine1.frequency.value = freq;
    const sine1Vol = 0.30 * velScale;
    sine1Gain.gain.setValueAtTime(0, now);
    sine1Gain.gain.linearRampToValueAtTime(sine1Vol, now + attack);
    sine1Gain.gain.linearRampToValueAtTime(sine1Vol * sustainLevel, now + attack + decay);
    sine1.connect(sine1Gain);
    sine1Gain.connect(this.masterGain!);
    sine1.start(now);
    oscillators.push(sine1);
    gains.push(sine1Gain);

    // Layer 2: Sine at 2x freq (bell-like overtone, characteristic of Rhodes)
    const sine2 = ctx.createOscillator();
    const sine2Gain = ctx.createGain();
    sine2.type = 'sine';
    sine2.frequency.value = freq * 2;
    const sine2Vol = 0.15 * velScale;
    sine2Gain.gain.setValueAtTime(0, now);
    sine2Gain.gain.linearRampToValueAtTime(sine2Vol, now + attack);
    // Bell overtone decays faster than fundamental
    sine2Gain.gain.linearRampToValueAtTime(sine2Vol * 0.2, now + attack + decay);
    sine2.connect(sine2Gain);
    sine2Gain.connect(this.masterGain!);
    sine2.start(now);
    oscillators.push(sine2);
    gains.push(sine2Gain);

    // Layer 3: Tremolo via LFO modulating a triangle layer
    const tri = ctx.createOscillator();
    const triGain = ctx.createGain();
    tri.type = 'triangle';
    tri.frequency.value = freq;
    tri.detune.value = 7; // slight chorus
    const triVol = 0.10 * velScale;
    triGain.gain.setValueAtTime(0, now);
    triGain.gain.linearRampToValueAtTime(triVol, now + attack);
    triGain.gain.linearRampToValueAtTime(triVol * sustainLevel, now + attack + decay);
    tri.connect(triGain);

    // LFO for tremolo effect
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 5.5; // ~5.5 Hz tremolo
    lfoGain.gain.value = triVol * 0.3; // subtle modulation depth
    lfo.connect(lfoGain);
    lfoGain.connect(triGain.gain);
    lfo.start(now);

    triGain.connect(this.masterGain!);
    tri.start(now);
    oscillators.push(tri, lfo);
    gains.push(triGain, lfoGain);

    this.activeVoices.set(midiNote, { oscillators, gains, velocity });
  }

  /**
   * Release a sustained note — triggers the release envelope.
   */
  stopNote(midiNote: MidiNote): void {
    const voice = this.activeVoices.get(midiNote);
    if (!voice) return;

    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    const release = 0.4;

    // Ramp down all gains and stop oscillators
    for (const gain of voice.gains) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + release);
    }
    for (const osc of voice.oscillators) {
      osc.stop(now + release + 0.05);
    }

    this.activeVoices.delete(midiNote);
  }

  /**
   * Stop all active notes (e.g., when pausing or quitting).
   */
  stopAllNotes(): void {
    for (const midiNote of this.activeVoices.keys()) {
      this.stopNote(midiNote);
    }
  }

  /**
   * Play a short fixed-duration note (used for SFX, not gameplay).
   */
  playNote(midiNote: MidiNote, duration: number = 0.3, velocity: number = 100): void {
    const ctx = this.ensureContext();
    const freq = midiNoteToFrequency(midiNote);
    const now = ctx.currentTime;

    const velScale = Math.max(0.2, velocity / 127);
    const attack = 0.005;
    const decay = 0.2;
    const sustainLevel = 0.3;
    const release = 0.5;
    const noteEnd = now + duration;

    const saw = ctx.createOscillator();
    const sawGain = ctx.createGain();
    saw.type = 'sawtooth';
    saw.frequency.value = freq;
    saw.detune.value = -5;
    const sawVol = 0.08 * velScale;
    sawGain.gain.setValueAtTime(0, now);
    sawGain.gain.linearRampToValueAtTime(sawVol, now + attack);
    sawGain.gain.linearRampToValueAtTime(sawVol * sustainLevel, now + attack + decay);
    sawGain.gain.setValueAtTime(sawVol * sustainLevel, noteEnd);
    sawGain.gain.linearRampToValueAtTime(0, noteEnd + release);
    saw.connect(sawGain);
    sawGain.connect(this.masterGain!);

    const tri = ctx.createOscillator();
    const triGain = ctx.createGain();
    tri.type = 'triangle';
    tri.frequency.value = freq;
    tri.detune.value = 3;
    const triVol = 0.25 * velScale;
    triGain.gain.setValueAtTime(0, now);
    triGain.gain.linearRampToValueAtTime(triVol, now + attack);
    triGain.gain.linearRampToValueAtTime(triVol * sustainLevel, now + attack + decay);
    triGain.gain.setValueAtTime(triVol * sustainLevel, noteEnd);
    triGain.gain.linearRampToValueAtTime(0, noteEnd + release);
    tri.connect(triGain);
    triGain.connect(this.masterGain!);

    const sine = ctx.createOscillator();
    const sineGain = ctx.createGain();
    sine.type = 'sine';
    sine.frequency.value = freq * 2;
    const sineVol = 0.12 * velScale;
    sineGain.gain.setValueAtTime(0, now);
    sineGain.gain.linearRampToValueAtTime(sineVol, now + attack);
    sineGain.gain.linearRampToValueAtTime(sineVol * sustainLevel, now + attack + decay);
    sineGain.gain.setValueAtTime(sineVol * sustainLevel, noteEnd);
    sineGain.gain.linearRampToValueAtTime(0, noteEnd + release);
    sine.connect(sineGain);
    sineGain.connect(this.masterGain!);

    const stopTime = noteEnd + release + 0.05;
    saw.start(now); saw.stop(stopTime);
    tri.start(now); tri.stop(stopTime);
    sine.start(now); sine.stop(stopTime);
  }

  playHitSound(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1200;
    osc.frequency.linearRampToValueAtTime(800, now + 0.04);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playComboSound(combo: number): void {
    if (combo !== 10 && combo !== 25 && combo !== 50) return;

    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const baseFreq = combo === 10 ? 600 : combo === 25 ? 800 : 1000;
    const noteCount = combo === 10 ? 2 : combo === 25 ? 3 : 4;

    for (let i = 0; i < noteCount; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + i * 0.08;

      osc.type = 'sine';
      osc.frequency.value = baseFreq + i * 200;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    }
  }

  playCrescendoActivate(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(400, now);
    osc1.frequency.linearRampToValueAtTime(1200, now + 0.3);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.linearRampToValueAtTime(1600, now + 0.3);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.setValueAtTime(0.15, now + 0.25);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain!);

    osc1.start(now);
    osc1.stop(now + 0.55);
    osc2.start(now);
    osc2.stop(now + 0.55);
  }

  // --- Gamification Sound Effects ---

  playStarEarned(starNumber: number): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const baseFreq = 800 + starNumber * 200;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playLevelUp(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.12;

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.linearRampToValueAtTime(0, t + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  playBadgeEarned(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const freqs = [440, 554, 659, 880]; // A4, C#5, E5, A5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.1;

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.linearRampToValueAtTime(i === 3 ? 0.1 : 0, t + 0.2);
      if (i === 3) {
        gain.gain.linearRampToValueAtTime(0, t + 0.6);
      }

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + (i === 3 ? 0.65 : 0.25));
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export default AudioEngine;
