import { MidiNote } from '@/types/game';
import { buildKeyboardMap, buildNoteToLane, getActiveLanes, DEFAULT_NOTE_RANGE } from '@/constants/keyboard';

export type NoteCallback = (midiNote: MidiNote, lane: number) => void;

class InputManager {
  private pressedKeys: Set<string> = new Set();
  private pressedMidiNotes: Set<MidiNote> = new Set();
  private onKeyDownCallback: NoteCallback | null = null;
  private onKeyUpCallback: NoteCallback | null = null;
  private active = false;

  // Dynamic mappings (rebuilt per song)
  private keyboardMap: Record<string, MidiNote>;
  private noteToLane: Map<MidiNote, number>;

  // MIDI state
  private midiAccess: MIDIAccess | null = null;
  private midiEnabled = false;
  private midiDevices: string[] = [];
  private midiDeviceListeners: Set<(devices: string[]) => void> = new Set();

  constructor() {
    // Default to the original 8-lane layout
    const defaultLanes = getActiveLanes(DEFAULT_NOTE_RANGE);
    this.keyboardMap = buildKeyboardMap(defaultLanes);
    this.noteToLane = buildNoteToLane(defaultLanes);
  }

  /**
   * Set active lanes for the current song. Rebuilds keyboard mapping.
   */
  setActiveLanes(activeLanes: MidiNote[]): void {
    this.keyboardMap = buildKeyboardMap(activeLanes);
    this.noteToLane = buildNoteToLane(activeLanes);
  }

  // --- MIDI Support ---

  /**
   * Initialize Web MIDI API. Call once on app startup.
   * Returns true if MIDI is available.
   */
  async enableMidi(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) return false;

    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      this.midiEnabled = true;
      this.updateMidiDevices();

      // Listen for device connect/disconnect — re-bind listeners on reconnect
      this.midiAccess.onstatechange = () => {
        this.updateMidiDevices();
        // Re-bind MIDI message handlers to any new inputs
        if (this.active) {
          this.startMidiListening();
        }
      };

      return true;
    } catch {
      console.warn('MIDI access denied or unavailable');
      return false;
    }
  }

  /** Force a fresh MIDI scan — useful after unplug/replug */
  async reconnectMidi(): Promise<boolean> {
    this.midiEnabled = false;
    this.midiAccess = null;
    this.midiDevices = [];
    return this.enableMidi();
  }

  private updateMidiDevices(): void {
    if (!this.midiAccess) return;
    this.midiDevices = [];
    this.midiAccess.inputs.forEach((input) => {
      if (input.state === 'connected') {
        this.midiDevices.push(input.name || 'Unknown MIDI Device');
      }
    });
    for (const cb of this.midiDeviceListeners) {
      cb(this.midiDevices);
    }
  }

  getConnectedMidiDevices(): string[] {
    return [...this.midiDevices];
  }

  isMidiEnabled(): boolean {
    return this.midiEnabled;
  }

  isMidiAvailable(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess;
  }

  /** @deprecated Use addOnMidiDevicesChanged/removeOnMidiDevicesChanged */
  setOnMidiDevicesChanged(callback: ((devices: string[]) => void) | null): void {
    // Back-compat: clear all and set one
    this.midiDeviceListeners.clear();
    if (callback) this.midiDeviceListeners.add(callback);
  }

  addOnMidiDevicesChanged(callback: (devices: string[]) => void): void {
    this.midiDeviceListeners.add(callback);
  }

  removeOnMidiDevicesChanged(callback: (devices: string[]) => void): void {
    this.midiDeviceListeners.delete(callback);
  }

  private handleMidiMessage = (event: MIDIMessageEvent): void => {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0] & 0xf0;
    const midiNote = data[1] as MidiNote;
    const velocity = data[2];

    if (status === 0x90 && velocity > 0) {
      // Note On
      this.handleMidiNoteOn(midiNote);
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      // Note Off
      this.handleMidiNoteOff(midiNote);
    }
  };

  private handleMidiNoteOn(midiNote: MidiNote): void {
    this.pressedMidiNotes.add(midiNote);
    // Always fire for MIDI — lane -1 means "not a game lane" (sound only)
    const lane = this.noteToLane.get(midiNote) ?? -1;
    if (this.onKeyDownCallback) {
      this.onKeyDownCallback(midiNote, lane);
    }
  }

  private handleMidiNoteOff(midiNote: MidiNote): void {
    this.pressedMidiNotes.delete(midiNote);
    const lane = this.noteToLane.get(midiNote) ?? -1;
    if (this.onKeyUpCallback) {
      this.onKeyUpCallback(midiNote, lane);
    }
  }

  private startMidiListening(): void {
    if (!this.midiAccess) return;
    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = this.handleMidiMessage;
    });
  }

  private stopMidiListening(): void {
    if (!this.midiAccess) return;
    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
  }

  // --- Keyboard handlers ---

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;

    const key = event.key.toLowerCase();
    const midiNote = this.keyboardMap[key];

    if (midiNote === undefined) return;

    event.preventDefault();
    this.pressedKeys.add(key);

    const lane = this.noteToLane.get(midiNote);
    if (lane !== undefined && this.onKeyDownCallback) {
      this.onKeyDownCallback(midiNote, lane);
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    const midiNote = this.keyboardMap[key];

    if (midiNote === undefined) return;

    event.preventDefault();
    this.pressedKeys.delete(key);

    const lane = this.noteToLane.get(midiNote);
    if (lane !== undefined && this.onKeyUpCallback) {
      this.onKeyUpCallback(midiNote, lane);
    }
  };

  set onKeyDown(callback: NoteCallback | null) {
    this.onKeyDownCallback = callback;
  }

  set onKeyUp(callback: NoteCallback | null) {
    this.onKeyUpCallback = callback;
  }

  isPressed(midiNote: MidiNote): boolean {
    // Check both keyboard and MIDI
    if (this.pressedMidiNotes.has(midiNote)) return true;
    const entry = Object.entries(this.keyboardMap).find(([, n]) => n === midiNote);
    return entry ? this.pressedKeys.has(entry[0]) : false;
  }

  getPressedNotes(): MidiNote[] {
    const fromKeys = Array.from(this.pressedKeys)
      .map((key) => this.keyboardMap[key])
      .filter((note): note is MidiNote => note !== undefined);
    const fromMidi = Array.from(this.pressedMidiNotes);
    return [...new Set([...fromKeys, ...fromMidi])];
  }

  start(): void {
    if (this.active) return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    if (this.midiEnabled) {
      this.startMidiListening();
    }
    this.active = true;
  }

  stop(): void {
    if (!this.active) return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.stopMidiListening();
    this.pressedKeys.clear();
    this.pressedMidiNotes.clear();
    this.active = false;
  }
}

export default InputManager;
