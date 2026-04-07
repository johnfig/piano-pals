import { Song, SongNote, MidiNote } from '@/types/game';
import { beatsToSeconds } from '@/utils/beats';

const BPM = 72;
const b = (beat: number) => beatsToSeconds(beat, BPM);

const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72;

// Authentic D major: every note shifted +2 semitones from C major
// C4→D4, D4→E4, E4→F#4, F4→G4, G4→A4, A4→B4, B4→C#5, C5→D5
const Fs4 = 66; // F#4 (enharmonic Gb4)
const Cs5 = 73; // C#5 (enharmonic Db5)
const D5 = 74;
const _D4 = 62, _E4 = 64, _G4 = 67, _A4 = 69, _B4 = 71;

// Canon in D - Pachelbel (simplified melody over the famous chord progression)
const melody: [number, MidiNote, number][] = [
  // Phrase 1: D major chord progression melody
  [0, D4, 1],
  [1, F4, 1],
  [2, A4, 1],
  [3, G4, 1],

  // Ascending run over first progression
  [4, F4, 0.5],
  [4.5, G4, 0.5],
  [5, A4, 0.5],
  [5.5, B4, 0.5],
  [6, C5, 1],
  [7, B4, 0.5],
  [7.5, A4, 0.5],

  // Phrase 2: descending with ornamentation
  [8, G4, 0.5],
  [8.5, A4, 0.5],
  [9, B4, 0.5],
  [9.5, A4, 0.5],
  [10, G4, 0.5],
  [10.5, F4, 0.5],
  [11, E4, 0.5],
  [11.5, D4, 0.5],

  // Phrase 3: chord tones ascending and descending
  [12, C4, 0.5],
  [12.5, D4, 0.5],
  [13, E4, 0.5],
  [13.5, F4, 0.5],
  [14, G4, 0.5],
  [14.5, A4, 0.5],
  [15, B4, 0.5],
  [15.5, C5, 0.5],

  // Phrase 4: the famous melody line with held notes
  [16, C5, 1.5],
  [17.5, B4, 0.5],
  [18, A4, 1.5],
  [19.5, G4, 0.5],
  [20, F4, 1.5],
  [21.5, E4, 0.5],
  [22, F4, 1.5],
  [23.5, G4, 0.5],

  // Phrase 5: dense sixteenth-note-like runs
  [24, A4, 0.5],
  [24.5, G4, 0.5],
  [25, F4, 0.5],
  [25.5, E4, 0.5],
  [26, D4, 0.5],
  [26.5, E4, 0.5],
  [27, F4, 0.5],
  [27.5, G4, 0.5],
  [28, A4, 0.5],
  [28.5, B4, 0.5],
  [29, C5, 0.5],
  [29.5, B4, 0.5],
  [30, A4, 0.5],
  [30.5, G4, 0.5],
  [31, F4, 0.5],
  [31.5, E4, 0.5],

  // Phrase 6: second variation with wider intervals
  [32, D4, 0.5],
  [32.5, A4, 0.5],
  [33, G4, 0.5],
  [33.5, C5, 0.5],
  [34, B4, 0.5],
  [34.5, F4, 0.5],
  [35, G4, 0.5],
  [35.5, D4, 0.5],
  [36, E4, 0.5],
  [36.5, B4, 0.5],
  [37, A4, 0.5],
  [37.5, C5, 0.5],
  [38, B4, 0.5],
  [38.5, G4, 0.5],
  [39, A4, 0.5],
  [39.5, F4, 0.5],

  // Phrase 7: climactic ascending sequence
  [40, C4, 0.5],
  [40.5, E4, 0.5],
  [41, D4, 0.5],
  [41.5, F4, 0.5],
  [42, E4, 0.5],
  [42.5, G4, 0.5],
  [43, F4, 0.5],
  [43.5, A4, 0.5],
  [44, G4, 0.5],
  [44.5, B4, 0.5],
  [45, A4, 0.5],
  [45.5, C5, 0.5],
  [46, B4, 1],
  [47, C5, 1],

  // Phrase 8: final resolution with mixed rhythms
  [48, A4, 0.5],
  [48.5, G4, 0.5],
  [49, F4, 0.5],
  [49.5, G4, 0.5],
  [50, A4, 1],
  [51, B4, 0.5],
  [51.5, C5, 0.5],
  [52, B4, 0.5],
  [52.5, A4, 0.5],
  [53, G4, 0.5],
  [53.5, F4, 0.5],
  [54, E4, 0.5],
  [54.5, D4, 0.5],
  [55, C4, 0.5],
  [55.5, D4, 0.5],
  [56, E4, 0.5],
  [56.5, F4, 0.5],
  [57, G4, 1],
  [58, A4, 1],

  // Final held chord tones
  [59, D4, 2],
  [59, F4, 2],
  [59, A4, 2],
];

// Authentic D major melody: C→D, D→E, E→F#, F→G, G→A, A→B, B→C#, C5→D5 (+2 semitones)
const pianoMelody: [number, MidiNote, number][] = [
  // Phrase 1: D major chord progression melody
  [0, _E4, 1],
  [1, _G4, 1],
  [2, _B4, 1],
  [3, _A4, 1],

  // Ascending run over first progression
  [4, _G4, 0.5],
  [4.5, _A4, 0.5],
  [5, _B4, 0.5],
  [5.5, Cs5, 0.5],
  [6, D5, 1],
  [7, Cs5, 0.5],
  [7.5, _B4, 0.5],

  // Phrase 2: descending with ornamentation
  [8, _A4, 0.5],
  [8.5, _B4, 0.5],
  [9, Cs5, 0.5],
  [9.5, _B4, 0.5],
  [10, _A4, 0.5],
  [10.5, _G4, 0.5],
  [11, Fs4, 0.5],
  [11.5, _E4, 0.5],

  // Phrase 3: chord tones ascending and descending
  [12, _D4, 0.5],
  [12.5, _E4, 0.5],
  [13, Fs4, 0.5],
  [13.5, _G4, 0.5],
  [14, _A4, 0.5],
  [14.5, _B4, 0.5],
  [15, Cs5, 0.5],
  [15.5, D5, 0.5],

  // Phrase 4: the famous melody line with held notes
  [16, D5, 1.5],
  [17.5, Cs5, 0.5],
  [18, _B4, 1.5],
  [19.5, _A4, 0.5],
  [20, _G4, 1.5],
  [21.5, Fs4, 0.5],
  [22, _G4, 1.5],
  [23.5, _A4, 0.5],

  // Phrase 5: dense sixteenth-note-like runs
  [24, _B4, 0.5],
  [24.5, _A4, 0.5],
  [25, _G4, 0.5],
  [25.5, Fs4, 0.5],
  [26, _E4, 0.5],
  [26.5, Fs4, 0.5],
  [27, _G4, 0.5],
  [27.5, _A4, 0.5],
  [28, _B4, 0.5],
  [28.5, Cs5, 0.5],
  [29, D5, 0.5],
  [29.5, Cs5, 0.5],
  [30, _B4, 0.5],
  [30.5, _A4, 0.5],
  [31, _G4, 0.5],
  [31.5, Fs4, 0.5],

  // Phrase 6: second variation with wider intervals
  [32, _E4, 0.5],
  [32.5, _B4, 0.5],
  [33, _A4, 0.5],
  [33.5, D5, 0.5],
  [34, Cs5, 0.5],
  [34.5, _G4, 0.5],
  [35, _A4, 0.5],
  [35.5, _E4, 0.5],
  [36, Fs4, 0.5],
  [36.5, Cs5, 0.5],
  [37, _B4, 0.5],
  [37.5, D5, 0.5],
  [38, Cs5, 0.5],
  [38.5, _A4, 0.5],
  [39, _B4, 0.5],
  [39.5, _G4, 0.5],

  // Phrase 7: climactic ascending sequence
  [40, _D4, 0.5],
  [40.5, Fs4, 0.5],
  [41, _E4, 0.5],
  [41.5, _G4, 0.5],
  [42, Fs4, 0.5],
  [42.5, _A4, 0.5],
  [43, _G4, 0.5],
  [43.5, _B4, 0.5],
  [44, _A4, 0.5],
  [44.5, Cs5, 0.5],
  [45, _B4, 0.5],
  [45.5, D5, 0.5],
  [46, Cs5, 1],
  [47, D5, 1],

  // Phrase 8: final resolution with mixed rhythms
  [48, _B4, 0.5],
  [48.5, _A4, 0.5],
  [49, _G4, 0.5],
  [49.5, _A4, 0.5],
  [50, _B4, 1],
  [51, Cs5, 0.5],
  [51.5, D5, 0.5],
  [52, Cs5, 0.5],
  [52.5, _B4, 0.5],
  [53, _A4, 0.5],
  [53.5, _G4, 0.5],
  [54, Fs4, 0.5],
  [54.5, _E4, 0.5],
  [55, _D4, 0.5],
  [55.5, _E4, 0.5],
  [56, Fs4, 0.5],
  [56.5, _G4, 0.5],
  [57, _A4, 1],
  [58, _B4, 1],

  // Final held chord tones
  [59, _E4, 2],
  [59, _G4, 2],
  [59, _B4, 2],
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

export const canonInD: Song = {
  id: 'canon-in-d',
  title: 'Canon in D',
  artist: 'Johann Pachelbel',
  difficulty: 'Hard',
  bpm: BPM,
  noteRange: { lowest: 60, highest: 72, whiteKeysOnly: true },
  notes,
  pianoNotes,
  pianoNoteRange: { lowest: 62, highest: 74, whiteKeysOnly: false },
};
