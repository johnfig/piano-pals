import { Song, SongNote, MidiNote } from '@/types/game';
import { beatsToSeconds } from '@/utils/beats';

const BPM = 96;
const b = (beat: number) => beatsToSeconds(beat, BPM);

// MIDI constants used
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, C5 = 72;

// Authentic D minor: C→D, D→E, E→F(b3), F→G, G→A
const _D4 = 62, _E4 = 64, _F4 = 65, _G4 = 67, _A4 = 69;

// French Folk Song (Au Clair de la Lune style, simplified)
// A simple stepwise melody in C major
const melody: [number, MidiNote, number][] = [
  // Phrase 1: C D E C | D E F D
  [0, C4, 1], [1, D4, 1], [2, E4, 1], [3, C4, 1],
  [4, D4, 1], [5, E4, 1], [6, F4, 1], [7, D4, 1],
  // Phrase 2: E F G E | F E D C
  [8, E4, 1], [9, F4, 1], [10, G4, 1], [11, E4, 1],
  [12, F4, 1], [13, E4, 1], [14, D4, 1], [15, C4, 1],
  // Phrase 3 (repeat of phrase 1): C D E C | D E F D
  [16, C4, 1], [17, D4, 1], [18, E4, 1], [19, C4, 1],
  [20, D4, 1], [21, E4, 1], [22, F4, 1], [23, D4, 1],
  // Phrase 4 (ending variation): E D C D | E F G C
  [24, E4, 1], [25, D4, 1], [26, C4, 1], [27, D4, 1],
  [28, E4, 1], [29, F4, 0.5], [30, E4, 0.5], [30.5, D4, 0.5], [31, C4, 2],
];

// Authentic D minor melody: C→D, D→E, E→F, F→G, G→A
const pianoMelody: [number, MidiNote, number][] = [
  // Phrase 1: D E F D | E F G E
  [0, _D4, 1], [1, _E4, 1], [2, _F4, 1], [3, _D4, 1],
  [4, _E4, 1], [5, _F4, 1], [6, _G4, 1], [7, _E4, 1],
  // Phrase 2: F G A F | G F E D
  [8, _F4, 1], [9, _G4, 1], [10, _A4, 1], [11, _F4, 1],
  [12, _G4, 1], [13, _F4, 1], [14, _E4, 1], [15, _D4, 1],
  // Phrase 3 (repeat of phrase 1): D E F D | E F G E
  [16, _D4, 1], [17, _E4, 1], [18, _F4, 1], [19, _D4, 1],
  [20, _E4, 1], [21, _F4, 1], [22, _G4, 1], [23, _E4, 1],
  // Phrase 4 (ending variation): F E D E | F G F E D
  [24, _F4, 1], [25, _E4, 1], [26, _D4, 1], [27, _E4, 1],
  [28, _F4, 1], [29, _G4, 0.5], [30, _F4, 0.5], [30.5, _E4, 0.5], [31, _D4, 2],
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

export const frenchFolkSong: Song = {
  id: 'suzuki-french-folk-song',
  title: 'French Folk Song',
  artist: 'Traditional',
  difficulty: 'Easy',
  bpm: BPM,
  noteRange: { lowest: 60, highest: 72, whiteKeysOnly: true },
  notes,
  pianoNotes,
  pianoNoteRange: { lowest: 62, highest: 69, whiteKeysOnly: false },
};
