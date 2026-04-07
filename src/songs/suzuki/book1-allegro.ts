import { Song, SongNote, MidiNote } from '@/types/game';
import { beatsToSeconds } from '@/utils/beats';

const BPM = 120;
const b = (beat: number) => beatsToSeconds(beat, BPM);

// MIDI constants used
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72;

// Piano version constants (G major, lower octave)
const G3 = 55 as MidiNote;
const A3 = 57 as MidiNote;
const B3 = 59 as MidiNote;
const Fs4 = 66 as MidiNote; // F#4

// Allegro - Suzuki Book 1
// Fast, lively piece with running eighth notes in C major
const melody: [number, MidiNote, number][] = [
  // Phrase 1: ascending C major scale fragments
  [0, C4, 0.5], [0.5, D4, 0.5], [1, E4, 0.5], [1.5, F4, 0.5],
  [2, G4, 1], [3, G4, 1],
  // Phrase 2: descending from A
  [4, A4, 0.5], [4.5, G4, 0.5], [5, F4, 0.5], [5.5, E4, 0.5],
  [6, D4, 1], [7, D4, 1],
  // Phrase 3: ascending to high range
  [8, E4, 0.5], [8.5, F4, 0.5], [9, G4, 0.5], [9.5, A4, 0.5],
  [10, B4, 0.5], [10.5, A4, 0.5], [11, G4, 0.5], [11.5, F4, 0.5],
  // Phrase 4: descending resolution
  [12, E4, 0.5], [12.5, D4, 0.5], [13, C4, 0.5], [13.5, D4, 0.5],
  [14, C4, 2],
  // Phrase 5: repeat with variation
  [16, C4, 0.5], [16.5, D4, 0.5], [17, E4, 0.5], [17.5, F4, 0.5],
  [18, G4, 1], [19, G4, 1],
  // Phrase 6: higher variation
  [20, A4, 0.5], [20.5, B4, 0.5], [21, C5, 0.5], [21.5, B4, 0.5],
  [22, A4, 0.5], [22.5, G4, 0.5], [23, F4, 0.5], [23.5, E4, 0.5],
  // Phrase 7: final descending run
  [24, D4, 0.5], [24.5, E4, 0.5], [25, F4, 0.5], [25.5, G4, 0.5],
  [26, E4, 0.5], [26.5, D4, 0.5], [27, C4, 0.5], [27.5, D4, 0.5],
  [28, C4, 2],
];

const notes: SongNote[] = melody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

// Authentic piano version in G major (-5 semitones, lower octave)
// C4→G3, D4→A3, E4→B3, F4→C4, G4→D4, A4→E4, B4→F#4, C5→G4
const pianoMelody: [number, MidiNote, number][] = [
  // Phrase 1: ascending G major scale fragments
  [0, G3, 0.5], [0.5, A3, 0.5], [1, B3, 0.5], [1.5, C4, 0.5],
  [2, D4, 1], [3, D4, 1],
  // Phrase 2: descending from E4
  [4, E4, 0.5], [4.5, D4, 0.5], [5, C4, 0.5], [5.5, B3, 0.5],
  [6, A3, 1], [7, A3, 1],
  // Phrase 3: ascending to high range
  [8, B3, 0.5], [8.5, C4, 0.5], [9, D4, 0.5], [9.5, E4, 0.5],
  [10, Fs4, 0.5], [10.5, E4, 0.5], [11, D4, 0.5], [11.5, C4, 0.5],
  // Phrase 4: descending resolution
  [12, B3, 0.5], [12.5, A3, 0.5], [13, G3, 0.5], [13.5, A3, 0.5],
  [14, G3, 2],
  // Phrase 5: repeat with variation
  [16, G3, 0.5], [16.5, A3, 0.5], [17, B3, 0.5], [17.5, C4, 0.5],
  [18, D4, 1], [19, D4, 1],
  // Phrase 6: higher variation
  [20, E4, 0.5], [20.5, Fs4, 0.5], [21, G4, 0.5], [21.5, Fs4, 0.5],
  [22, E4, 0.5], [22.5, D4, 0.5], [23, C4, 0.5], [23.5, B3, 0.5],
  // Phrase 7: final descending run
  [24, A3, 0.5], [24.5, B3, 0.5], [25, C4, 0.5], [25.5, D4, 0.5],
  [26, B3, 0.5], [26.5, A3, 0.5], [27, G3, 0.5], [27.5, A3, 0.5],
  [28, G3, 2],
];

const pianoNotes: SongNote[] = pianoMelody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

export const allegro: Song = {
  id: 'suzuki-allegro',
  title: 'Allegro',
  artist: 'Suzuki',
  difficulty: 'Medium',
  bpm: BPM,
  noteRange: { lowest: 60, highest: 72, whiteKeysOnly: true },
  notes,
  pianoNotes,
  pianoNoteRange: { lowest: 55, highest: 67, whiteKeysOnly: false },
};
