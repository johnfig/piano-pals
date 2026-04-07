import { Song, SongNote, MidiNote } from '@/types/game';
import { beatsToSeconds } from '@/utils/beats';

const BPM = 108;
const b = (beat: number) => beatsToSeconds(beat, BPM);

// MIDI constants used
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74, E5 = 76;

// Piano version constants (G major, lower octave)
const G3 = 55 as MidiNote;
const A3 = 57 as MidiNote;
const B3 = 59 as MidiNote;
const Fs4 = 66 as MidiNote; // F#4

// Minuet in G Major (BWV Anh. 114) - attributed to Christian Petzold
// The most famous "Bach" minuet from Suzuki Book 1
// 3/4 time - beats are in groups of 3
// Simplified for white keys
const melody: [number, MidiNote, number][] = [
  // Bar 1: D  G  A  (pickup + beat 1-2-3 of bar 1)
  [0, D4, 1], [1, G4, 1], [2, A4, 1],
  // Bar 2: B  C5  D5
  [3, B4, 1], [4, C5, 1], [5, D5, 1],
  // Bar 3: G  G  (half + quarter)
  [6, G4, 2], [8, G4, 1],
  // Bar 4: E  C5  D5  E5  D5
  [9, E4, 0.5], [9.5, C5, 0.5], [10, D5, 0.5], [10.5, E5, 0.5], [11, D5, 1],
  // Bar 5: C5  B  A  G
  [12, C5, 1], [13, B4, 1], [14, A4, 1],
  // Bar 6: B  A  G  F
  [15, B4, 0.5], [15.5, A4, 0.5], [16, G4, 1], [17, F4, 1],
  // Bar 7: G  A  G  F  E
  [18, G4, 0.5], [18.5, A4, 0.5], [19, G4, 0.5], [19.5, F4, 0.5], [20, E4, 1],
  // Bar 8: D  E  C  D  B4
  [21, D4, 0.5], [21.5, E4, 0.5], [22, C4, 0.5], [22.5, D4, 0.5], [23, B4, 1],
  // Bar 9: A  B  G  (resolution)
  [24, A4, 1], [25, B4, 0.5], [25.5, A4, 0.5], [26, G4, 2],

  // Part 2 (second half of minuet)
  // Bar 10: B  G  A  B
  [28, B4, 1], [29, G4, 1], [30, A4, 1],
  // Bar 11: B  C5  B  A
  [31, B4, 1], [32, C5, 1], [33, B4, 0.5], [33.5, A4, 0.5],
  // Bar 12: G  A  B  A  G
  [34, G4, 0.5], [34.5, A4, 0.5], [35, B4, 0.5], [35.5, A4, 0.5], [36, G4, 1],
  // Bar 13: F  G  A  G  F  E
  [37, F4, 0.5], [37.5, G4, 0.5], [38, A4, 0.5], [38.5, G4, 0.5], [39, F4, 0.5], [39.5, E4, 0.5],
  // Bar 14: D  G  B  D5
  [40, D4, 1], [41, G4, 1], [42, B4, 1],
  // Bar 15: C5  B  A  B  A  G
  [43, C5, 0.5], [43.5, B4, 0.5], [44, A4, 0.5], [44.5, B4, 0.5], [45, A4, 0.5], [45.5, G4, 0.5],
  // Bar 16: final G
  [46, G4, 2],
];

const notes: SongNote[] = melody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

// Authentic piano version in G major (-5 semitones, lower octave)
// C4→G3, D4→A3, E4→B3, F4→C4, G4→D4, A4→E4, B4→F#4, C5→G4, D5→A4, E5→B4
const pianoMelody: [number, MidiNote, number][] = [
  // Bar 1: A3  D4  E4
  [0, A3, 1], [1, D4, 1], [2, E4, 1],
  // Bar 2: F#4  G4  A4
  [3, Fs4, 1], [4, G4, 1], [5, A4, 1],
  // Bar 3: D4  D4
  [6, D4, 2], [8, D4, 1],
  // Bar 4: B3  G4  A4  B4  A4
  [9, B3, 0.5], [9.5, G4, 0.5], [10, A4, 0.5], [10.5, B4, 0.5], [11, A4, 1],
  // Bar 5: G4  F#4  E4
  [12, G4, 1], [13, Fs4, 1], [14, E4, 1],
  // Bar 6: F#4  E4  D4  C4
  [15, Fs4, 0.5], [15.5, E4, 0.5], [16, D4, 1], [17, C4, 1],
  // Bar 7: D4  E4  D4  C4  B3
  [18, D4, 0.5], [18.5, E4, 0.5], [19, D4, 0.5], [19.5, C4, 0.5], [20, B3, 1],
  // Bar 8: A3  B3  G3  A3  F#4
  [21, A3, 0.5], [21.5, B3, 0.5], [22, G3, 0.5], [22.5, A3, 0.5], [23, Fs4, 1],
  // Bar 9: E4  F#4  E4  D4
  [24, E4, 1], [25, Fs4, 0.5], [25.5, E4, 0.5], [26, D4, 2],

  // Part 2
  // Bar 10: F#4  D4  E4
  [28, Fs4, 1], [29, D4, 1], [30, E4, 1],
  // Bar 11: F#4  G4  F#4  E4
  [31, Fs4, 1], [32, G4, 1], [33, Fs4, 0.5], [33.5, E4, 0.5],
  // Bar 12: D4  E4  F#4  E4  D4
  [34, D4, 0.5], [34.5, E4, 0.5], [35, Fs4, 0.5], [35.5, E4, 0.5], [36, D4, 1],
  // Bar 13: C4  D4  E4  D4  C4  B3
  [37, C4, 0.5], [37.5, D4, 0.5], [38, E4, 0.5], [38.5, D4, 0.5], [39, C4, 0.5], [39.5, B3, 0.5],
  // Bar 14: A3  D4  F#4
  [40, A3, 1], [41, D4, 1], [42, Fs4, 1],
  // Bar 15: G4  F#4  E4  F#4  E4  D4
  [43, G4, 0.5], [43.5, Fs4, 0.5], [44, E4, 0.5], [44.5, Fs4, 0.5], [45, E4, 0.5], [45.5, D4, 0.5],
  // Bar 16: D4
  [46, D4, 2],
];

const pianoNotes: SongNote[] = pianoMelody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

export const minuet1: Song = {
  id: 'suzuki-minuet-1',
  title: 'Minuet 1 in G',
  artist: 'J.S. Bach',
  difficulty: 'Medium',
  bpm: BPM,
  noteRange: { lowest: 60, highest: 76, whiteKeysOnly: true },
  notes,
  pianoNotes,
  pianoNoteRange: { lowest: 55, highest: 71, whiteKeysOnly: false },
};
