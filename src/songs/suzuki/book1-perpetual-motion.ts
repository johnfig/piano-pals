import { Song, SongNote, MidiNote } from '@/types/game';
import { beatsToSeconds } from '@/utils/beats';

const BPM = 132;
const b = (beat: number) => beatsToSeconds(beat, BPM);

// MIDI constants used
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74;

// Authentic D major (+2 semitones): C→D, D→E, E→F#, F→G, G→A, A→B, B→C#, C5→D5, D5→E5
const Fs4 = 66, Cs5 = 73, E5 = 76;
const _D4 = 62, _E4 = 64, _G4 = 67, _A4 = 69, _B4 = 71, _D5 = 74;

// Perpetual Motion - Suzuki Book 1
// Continuous running eighth notes throughout - a technical exercise
const melody: [number, MidiNote, number][] = [
  // Bar 1-2: ascending C major scale
  [0, C4, 0.5], [0.5, D4, 0.5], [1, E4, 0.5], [1.5, F4, 0.5],
  [2, G4, 0.5], [2.5, A4, 0.5], [3, B4, 0.5], [3.5, C5, 0.5],
  // Bar 3-4: descending from D5
  [4, D5, 0.5], [4.5, C5, 0.5], [5, B4, 0.5], [5.5, A4, 0.5],
  [6, G4, 0.5], [6.5, F4, 0.5], [7, E4, 0.5], [7.5, D4, 0.5],
  // Bar 5-6: zigzag pattern
  [8, C4, 0.5], [8.5, E4, 0.5], [9, D4, 0.5], [9.5, F4, 0.5],
  [10, E4, 0.5], [10.5, G4, 0.5], [11, F4, 0.5], [11.5, A4, 0.5],
  // Bar 7-8: ascending to peak, then down
  [12, G4, 0.5], [12.5, B4, 0.5], [13, A4, 0.5], [13.5, C5, 0.5],
  [14, B4, 0.5], [14.5, D5, 0.5], [15, C5, 0.5], [15.5, B4, 0.5],
  // Bar 9-10: descending scale pattern
  [16, A4, 0.5], [16.5, G4, 0.5], [17, F4, 0.5], [17.5, E4, 0.5],
  [18, D4, 0.5], [18.5, C4, 0.5], [19, D4, 0.5], [19.5, E4, 0.5],
  // Bar 11-12: ascending again
  [20, F4, 0.5], [20.5, G4, 0.5], [21, A4, 0.5], [21.5, B4, 0.5],
  [22, C5, 0.5], [22.5, D5, 0.5], [23, C5, 0.5], [23.5, B4, 0.5],
  // Bar 13-14: descending to resolution
  [24, A4, 0.5], [24.5, G4, 0.5], [25, F4, 0.5], [25.5, E4, 0.5],
  [26, D4, 0.5], [26.5, E4, 0.5], [27, D4, 0.5], [27.5, C4, 0.5],
  // Bar 15-16: final cadence
  [28, D4, 0.5], [28.5, E4, 0.5], [29, F4, 0.5], [29.5, G4, 0.5],
  [30, E4, 0.5], [30.5, D4, 0.5], [31, C4, 1],
];

// Authentic D major melody (+2 semitones from C major)
const pianoMelody: [number, MidiNote, number][] = [
  // Bar 1-2: ascending D major scale
  [0, _D4, 0.5], [0.5, _E4, 0.5], [1, Fs4, 0.5], [1.5, _G4, 0.5],
  [2, _A4, 0.5], [2.5, _B4, 0.5], [3, Cs5, 0.5], [3.5, _D5, 0.5],
  // Bar 3-4: descending from E5
  [4, E5, 0.5], [4.5, _D5, 0.5], [5, Cs5, 0.5], [5.5, _B4, 0.5],
  [6, _A4, 0.5], [6.5, _G4, 0.5], [7, Fs4, 0.5], [7.5, _E4, 0.5],
  // Bar 5-6: zigzag pattern
  [8, _D4, 0.5], [8.5, Fs4, 0.5], [9, _E4, 0.5], [9.5, _G4, 0.5],
  [10, Fs4, 0.5], [10.5, _A4, 0.5], [11, _G4, 0.5], [11.5, _B4, 0.5],
  // Bar 7-8: ascending to peak, then down
  [12, _A4, 0.5], [12.5, Cs5, 0.5], [13, _B4, 0.5], [13.5, _D5, 0.5],
  [14, Cs5, 0.5], [14.5, E5, 0.5], [15, _D5, 0.5], [15.5, Cs5, 0.5],
  // Bar 9-10: descending scale pattern
  [16, _B4, 0.5], [16.5, _A4, 0.5], [17, _G4, 0.5], [17.5, Fs4, 0.5],
  [18, _E4, 0.5], [18.5, _D4, 0.5], [19, _E4, 0.5], [19.5, Fs4, 0.5],
  // Bar 11-12: ascending again
  [20, _G4, 0.5], [20.5, _A4, 0.5], [21, _B4, 0.5], [21.5, Cs5, 0.5],
  [22, _D5, 0.5], [22.5, E5, 0.5], [23, _D5, 0.5], [23.5, Cs5, 0.5],
  // Bar 13-14: descending to resolution
  [24, _B4, 0.5], [24.5, _A4, 0.5], [25, _G4, 0.5], [25.5, Fs4, 0.5],
  [26, _E4, 0.5], [26.5, Fs4, 0.5], [27, _E4, 0.5], [27.5, _D4, 0.5],
  // Bar 15-16: final cadence
  [28, _E4, 0.5], [28.5, Fs4, 0.5], [29, _G4, 0.5], [29.5, _A4, 0.5],
  [30, Fs4, 0.5], [30.5, _E4, 0.5], [31, _D4, 1],
];

const notes: SongNote[] = melody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

const pianoNotes: SongNote[] = pianoMelody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

export const perpetualMotion: Song = {
  id: 'suzuki-perpetual-motion',
  title: 'Perpetual Motion',
  artist: 'Suzuki',
  difficulty: 'Medium',
  bpm: BPM,
  noteRange: { lowest: 60, highest: 74, whiteKeysOnly: true },
  notes,
  pianoNotes,
  pianoNoteRange: { lowest: 62, highest: 76, whiteKeysOnly: false },
};
