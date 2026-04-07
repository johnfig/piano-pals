import { Song, SongNote, MidiNote } from '@/types/game';
import { beatsToSeconds } from '@/utils/beats';

const BPM = 100;
const b = (beat: number) => beatsToSeconds(beat, BPM);

// MIDI constants used
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, C5 = 72;

// Authentic A major (-3 semitones): C→A, D→B, E→C#, F→D, G→E, A→F#, C5→A4
const A3 = 57, B3 = 59, Cs4 = 61, Fs4 = 66;
const _D4 = 62, _E4 = 64, _A4 = 69;

// Twinkle Twinkle Variation A - rhythmic variation with pairs of sixteenth notes
// Each melodic note becomes two sixteenth notes (0.25 beats each)
// Pattern: C-C G-G A-A G-- | F-F E-E D-D C-- | etc.
const melody: [number, MidiNote, number][] = [
  // Line 1: "Twinkle twinkle little star" - paired sixteenths
  [0, C4, 0.25], [0.25, C4, 0.25], [1, G4, 0.25], [1.25, G4, 0.25],
  [2, A4, 0.25], [2.25, A4, 0.25], [3, G4, 1],
  // Line 2: "How I wonder what you are"
  [4, F4, 0.25], [4.25, F4, 0.25], [5, E4, 0.25], [5.25, E4, 0.25],
  [6, D4, 0.25], [6.25, D4, 0.25], [7, C4, 1],
  // Line 3: "Up above the world so high"
  [8, G4, 0.25], [8.25, G4, 0.25], [9, F4, 0.25], [9.25, F4, 0.25],
  [10, E4, 0.25], [10.25, E4, 0.25], [11, D4, 1],
  // Line 4: "Like a diamond in the sky"
  [12, G4, 0.25], [12.25, G4, 0.25], [13, F4, 0.25], [13.25, F4, 0.25],
  [14, E4, 0.25], [14.25, E4, 0.25], [15, D4, 1],
  // Line 5: "Twinkle twinkle little star"
  [16, C4, 0.25], [16.25, C4, 0.25], [17, G4, 0.25], [17.25, G4, 0.25],
  [18, A4, 0.25], [18.25, A4, 0.25], [19, G4, 1],
  // Line 6: "How I wonder what you are"
  [20, F4, 0.25], [20.25, F4, 0.25], [21, E4, 0.25], [21.25, E4, 0.25],
  [22, D4, 0.25], [22.25, D4, 0.25], [23, C4, 1],
];

// Authentic A major melody (-3 semitones from C major)
const pianoMelody: [number, MidiNote, number][] = [
  // Line 1: "Twinkle twinkle little star" - paired sixteenths
  [0, A3, 0.25], [0.25, A3, 0.25], [1, _E4, 0.25], [1.25, _E4, 0.25],
  [2, Fs4, 0.25], [2.25, Fs4, 0.25], [3, _E4, 1],
  // Line 2: "How I wonder what you are"
  [4, _D4, 0.25], [4.25, _D4, 0.25], [5, Cs4, 0.25], [5.25, Cs4, 0.25],
  [6, B3, 0.25], [6.25, B3, 0.25], [7, A3, 1],
  // Line 3: "Up above the world so high"
  [8, _E4, 0.25], [8.25, _E4, 0.25], [9, _D4, 0.25], [9.25, _D4, 0.25],
  [10, Cs4, 0.25], [10.25, Cs4, 0.25], [11, B3, 1],
  // Line 4: "Like a diamond in the sky"
  [12, _E4, 0.25], [12.25, _E4, 0.25], [13, _D4, 0.25], [13.25, _D4, 0.25],
  [14, Cs4, 0.25], [14.25, Cs4, 0.25], [15, B3, 1],
  // Line 5: "Twinkle twinkle little star"
  [16, A3, 0.25], [16.25, A3, 0.25], [17, _E4, 0.25], [17.25, _E4, 0.25],
  [18, Fs4, 0.25], [18.25, Fs4, 0.25], [19, _E4, 1],
  // Line 6: "How I wonder what you are"
  [20, _D4, 0.25], [20.25, _D4, 0.25], [21, Cs4, 0.25], [21.25, Cs4, 0.25],
  [22, B3, 0.25], [22.25, B3, 0.25], [23, A3, 1],
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

export const twinkleVarA: Song = {
  id: 'suzuki-twinkle-var-a',
  title: 'Twinkle Twinkle Variation A',
  artist: 'Suzuki',
  difficulty: 'Easy',
  bpm: BPM,
  noteRange: { lowest: 60, highest: 72, whiteKeysOnly: true },
  notes,
  pianoNotes,
  pianoNoteRange: { lowest: 57, highest: 69, whiteKeysOnly: false },
};
