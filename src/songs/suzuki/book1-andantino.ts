import { Song, SongNote, MidiNote } from '@/types/game';
import { beatsToSeconds } from '@/utils/beats';

const BPM = 84;
const b = (beat: number) => beatsToSeconds(beat, BPM);

// MIDI constants used
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74;

// Piano version constants (G major, lower octave)
const G3 = 55 as MidiNote;
const A3 = 57 as MidiNote;
const B3 = 59 as MidiNote;
const Fs4 = 66 as MidiNote; // F#4

// Andantino - Suzuki Book 1
// Slower, lyrical piece with longer note values
// Centered around G major scale (white keys only arrangement)
const melody: [number, MidiNote, number][] = [
  // Phrase 1: G A B C5 | D5 C5 B A
  [0, G4, 1], [1, A4, 1], [2, B4, 1], [3, C5, 1],
  [4, D5, 1], [5, C5, 1], [6, B4, 1], [7, A4, 1],
  // Phrase 2: G A B G | A ---
  [8, G4, 1], [9, A4, 1], [10, B4, 1], [11, G4, 1],
  [12, A4, 2], [14, G4, 2],
  // Phrase 3: G A B C5 | D5 C5 B A
  [16, G4, 1], [17, A4, 1], [18, B4, 1], [19, C5, 1],
  [20, D5, 1], [21, C5, 1], [22, B4, 1], [23, A4, 1],
  // Phrase 4: G B D5 G4 | C5 ---
  [24, G4, 1], [25, B4, 1], [26, D5, 1], [27, G4, 1],
  [28, A4, 1], [29, B4, 0.5], [29.5, A4, 0.5], [30, G4, 2],
  // Phrase 5 (B section): B C5 D5 B | C5 D5 E4 C5
  [32, B4, 1], [33, C5, 1], [34, D5, 1], [35, B4, 1],
  [36, C5, 1.5], [37.5, B4, 0.5], [38, A4, 2],
  // Phrase 6 (closing): G A B C5 | B A G ---
  [40, G4, 1], [41, A4, 1], [42, B4, 1], [43, C5, 1],
  [44, B4, 1], [45, A4, 1], [46, G4, 2],
];

const notes: SongNote[] = melody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

// Authentic piano version in G major (-5 semitones, lower octave)
// G4→D4, A4→E4, B4→F#4, C5→G4, D5→A4
const pianoMelody: [number, MidiNote, number][] = [
  // Phrase 1: D4 E4 F#4 G4 | A4 G4 F#4 E4
  [0, D4, 1], [1, E4, 1], [2, Fs4, 1], [3, G4, 1],
  [4, A4, 1], [5, G4, 1], [6, Fs4, 1], [7, E4, 1],
  // Phrase 2: D4 E4 F#4 D4 | E4 --- D4 ---
  [8, D4, 1], [9, E4, 1], [10, Fs4, 1], [11, D4, 1],
  [12, E4, 2], [14, D4, 2],
  // Phrase 3: D4 E4 F#4 G4 | A4 G4 F#4 E4
  [16, D4, 1], [17, E4, 1], [18, Fs4, 1], [19, G4, 1],
  [20, A4, 1], [21, G4, 1], [22, Fs4, 1], [23, E4, 1],
  // Phrase 4: D4 F#4 A4 D4 | E4 F#4 E4 D4
  [24, D4, 1], [25, Fs4, 1], [26, A4, 1], [27, D4, 1],
  [28, E4, 1], [29, Fs4, 0.5], [29.5, E4, 0.5], [30, D4, 2],
  // Phrase 5 (B section): F#4 G4 A4 F#4 | G4 F#4 E4
  [32, Fs4, 1], [33, G4, 1], [34, A4, 1], [35, Fs4, 1],
  [36, G4, 1.5], [37.5, Fs4, 0.5], [38, E4, 2],
  // Phrase 6 (closing): D4 E4 F#4 G4 | F#4 E4 D4 ---
  [40, D4, 1], [41, E4, 1], [42, Fs4, 1], [43, G4, 1],
  [44, Fs4, 1], [45, E4, 1], [46, D4, 2],
];

const pianoNotes: SongNote[] = pianoMelody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

export const andantino: Song = {
  id: 'suzuki-andantino',
  title: 'Andantino',
  artist: 'Suzuki',
  difficulty: 'Medium',
  bpm: BPM,
  noteRange: { lowest: 60, highest: 74, whiteKeysOnly: true },
  notes,
  pianoNotes,
  pianoNoteRange: { lowest: 62, highest: 69, whiteKeysOnly: false },
};
