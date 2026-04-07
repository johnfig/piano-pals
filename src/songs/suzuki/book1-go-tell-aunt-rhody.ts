import { Song, SongNote, MidiNote } from '@/types/game';
import { beatsToSeconds } from '@/utils/beats';

const BPM = 100;
const b = (beat: number) => beatsToSeconds(beat, BPM);

// MIDI constants used
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, C5 = 72;

// Piano version constants (G major, lower octave)
const G3 = 55 as MidiNote;
const A3 = 57 as MidiNote;
const B3 = 59 as MidiNote;

// Go Tell Aunt Rhody
// Traditional melody - the old grey goose is dead
// Suzuki Book 1 arrangement in C major
const melody: [number, MidiNote, number][] = [
  // Phrase 1: "Go tell Aunt Rhody" - E E E D | C D E
  [0, E4, 1], [1, E4, 1], [2, E4, 1.5], [3.5, D4, 0.5],
  [4, C4, 1], [5, D4, 1], [6, E4, 2],
  // Phrase 2: "Go tell Aunt Rhody" - F E D E | D C C
  [8, F4, 1], [9, E4, 1], [10, D4, 1], [11, E4, 1],
  [12, D4, 1.5], [13.5, C4, 0.5], [14, C4, 2],
  // Phrase 3: "The old grey goose is" - E E E D | C D E
  [16, E4, 1], [17, E4, 1], [18, E4, 1.5], [19.5, D4, 0.5],
  [20, C4, 1], [21, D4, 1], [22, E4, 2],
  // Phrase 4: "dead" - D E F E | D C C
  [24, D4, 1], [25, E4, 1], [26, F4, 1], [27, E4, 1],
  [28, D4, 1.5], [29.5, C4, 0.5], [30, C4, 2],
];

const notes: SongNote[] = melody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

// Authentic piano version in G major (-5 semitones, lower octave)
// C4→G3, D4→A3, E4→B3, F4→C4, G4→D4
const pianoMelody: [number, MidiNote, number][] = [
  // Phrase 1: "Go tell Aunt Rhody" - B3 B3 B3 A3 | G3 A3 B3
  [0, B3, 1], [1, B3, 1], [2, B3, 1.5], [3.5, A3, 0.5],
  [4, G3, 1], [5, A3, 1], [6, B3, 2],
  // Phrase 2: "Go tell Aunt Rhody" - C4 B3 A3 B3 | A3 G3 G3
  [8, C4, 1], [9, B3, 1], [10, A3, 1], [11, B3, 1],
  [12, A3, 1.5], [13.5, G3, 0.5], [14, G3, 2],
  // Phrase 3: "The old grey goose is" - B3 B3 B3 A3 | G3 A3 B3
  [16, B3, 1], [17, B3, 1], [18, B3, 1.5], [19.5, A3, 0.5],
  [20, G3, 1], [21, A3, 1], [22, B3, 2],
  // Phrase 4: "dead" - A3 B3 C4 B3 | A3 G3 G3
  [24, A3, 1], [25, B3, 1], [26, C4, 1], [27, B3, 1],
  [28, A3, 1.5], [29.5, G3, 0.5], [30, G3, 2],
];

const pianoNotes: SongNote[] = pianoMelody.map(([beat, note, dur]) => ({
  time: b(beat),
  note,
  duration: b(dur),
}));

export const goTellAuntRhody: Song = {
  id: 'suzuki-go-tell-aunt-rhody',
  title: 'Go Tell Aunt Rhody',
  artist: 'Traditional',
  difficulty: 'Easy',
  bpm: BPM,
  noteRange: { lowest: 60, highest: 72, whiteKeysOnly: true },
  notes,
  pianoNotes,
  pianoNoteRange: { lowest: 55, highest: 60, whiteKeysOnly: false },
};
