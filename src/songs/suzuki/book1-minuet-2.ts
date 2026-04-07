import { Song, SongNote, MidiNote } from '@/types/game';
import { beatsToSeconds } from '@/utils/beats';

const BPM = 100;
const b = (beat: number) => beatsToSeconds(beat, BPM);

// MIDI constants used
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74, E5 = 76;

// Piano version constants (G minor, lower octave)
const A3 = 57 as MidiNote;
const Bb3 = 58 as MidiNote;  // Bb3 (minor 3rd)
const Eb4 = 63 as MidiNote;  // Eb4 (minor 6th)
const Fs4 = 66 as MidiNote;  // F#4 (raised 7th, harmonic minor)
const Bb4 = 70 as MidiNote;  // Bb4 (minor 3rd, octave higher)

// Minuet 2 in G minor (BWV Anh. 115) - attributed to Christian Petzold
// The companion to Minuet 1, simplified for white keys
// 3/4 time
const melody: [number, MidiNote, number][] = [
  // Part 1
  // Bar 1: A  B  C5  D5
  [0, A4, 1], [1, B4, 1], [2, C5, 1],
  // Bar 2: D5  E5  C5  B
  [3, D5, 1.5], [4.5, E5, 0.5], [5, C5, 1],
  // Bar 3: B  A  G  A
  [6, B4, 1], [7, A4, 1], [8, G4, 1],
  // Bar 4: A  B  C5  D5 ---
  [9, A4, 1], [10, B4, 1], [11, C5, 1],
  [12, D5, 2], [14, D5, 1],
  // Bar 5-6: E5  D5  C5  B | A  G  F  E
  [15, E5, 1], [16, D5, 1], [17, C5, 1],
  [18, B4, 1], [19, A4, 1], [20, G4, 1],
  // Bar 7-8: F  E  D  E | F  G  A ---
  [21, F4, 1], [22, E4, 1], [23, D4, 1],
  [24, E4, 0.5], [24.5, F4, 0.5], [25, G4, 1], [26, A4, 2],

  // Part 2
  // Bar 9: D5  C5  B  A
  [28, D5, 1], [29, C5, 1], [30, B4, 1],
  // Bar 10: A  G  A  B
  [31, A4, 1], [32, G4, 1], [33, A4, 1],
  // Bar 11: B  C5  D5  E5
  [34, B4, 1], [35, C5, 1], [36, D5, 1],
  // Bar 12: E5  D5  C5  B  A
  [37, E5, 1], [38, D5, 0.5], [38.5, C5, 0.5], [39, B4, 0.5], [39.5, A4, 0.5],
  // Bar 13: G  A  B  G
  [40, G4, 1], [41, A4, 1], [42, B4, 1],
  // Bar 14: A  B  A  G ---
  [43, A4, 0.5], [43.5, B4, 0.5], [44, A4, 1], [45, G4, 2],
];

const notes: SongNote[] = melody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

// Authentic piano version in G minor (-5 semitones, lower octave)
// D4→A3, E4→Bb3, F4→C4, G4→D4, A4→Eb4, B4→F#4, C5→G4, D5→A4, E5→Bb4
const pianoMelody: [number, MidiNote, number][] = [
  // Part 1
  // Bar 1: Eb4  F#4  G4
  [0, Eb4, 1], [1, Fs4, 1], [2, G4, 1],
  // Bar 2: A4  Bb4  G4
  [3, A4, 1.5], [4.5, Bb4, 0.5], [5, G4, 1],
  // Bar 3: F#4  Eb4  D4
  [6, Fs4, 1], [7, Eb4, 1], [8, D4, 1],
  // Bar 4: Eb4  F#4  G4  A4 ---
  [9, Eb4, 1], [10, Fs4, 1], [11, G4, 1],
  [12, A4, 2], [14, A4, 1],
  // Bar 5-6: Bb4  A4  G4 | F#4  Eb4  D4
  [15, Bb4, 1], [16, A4, 1], [17, G4, 1],
  [18, Fs4, 1], [19, Eb4, 1], [20, D4, 1],
  // Bar 7-8: C4  Bb3  A3 | Bb3  C4  D4  Eb4 ---
  [21, C4, 1], [22, Bb3, 1], [23, A3, 1],
  [24, Bb3, 0.5], [24.5, C4, 0.5], [25, D4, 1], [26, Eb4, 2],

  // Part 2
  // Bar 9: A4  G4  F#4
  [28, A4, 1], [29, G4, 1], [30, Fs4, 1],
  // Bar 10: Eb4  D4  Eb4
  [31, Eb4, 1], [32, D4, 1], [33, Eb4, 1],
  // Bar 11: F#4  G4  A4
  [34, Fs4, 1], [35, G4, 1], [36, A4, 1],
  // Bar 12: Bb4  A4  G4  F#4  Eb4
  [37, Bb4, 1], [38, A4, 0.5], [38.5, G4, 0.5], [39, Fs4, 0.5], [39.5, Eb4, 0.5],
  // Bar 13: D4  Eb4  F#4
  [40, D4, 1], [41, Eb4, 1], [42, Fs4, 1],
  // Bar 14: Eb4  F#4  Eb4  D4 ---
  [43, Eb4, 0.5], [43.5, Fs4, 0.5], [44, Eb4, 1], [45, D4, 2],
];

const pianoNotes: SongNote[] = pianoMelody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

export const minuet2: Song = {
  id: 'suzuki-minuet-2',
  title: 'Minuet 2 in G minor',
  artist: 'J.S. Bach',
  difficulty: 'Medium',
  bpm: BPM,
  noteRange: { lowest: 60, highest: 76, whiteKeysOnly: true },
  notes,
  pianoNotes,
  pianoNoteRange: { lowest: 57, highest: 70, whiteKeysOnly: false },
};
