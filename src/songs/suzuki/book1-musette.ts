import { Song, SongNote, MidiNote } from '@/types/game';
import { beatsToSeconds } from '@/utils/beats';

const BPM = 96;
const b = (beat: number) => beatsToSeconds(beat, BPM);

// MIDI constants used
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72;

// Authentic D major (+2 semitones): C→D, D→E, E→F#, F→G, G→A, A→B, B→C#, C5→D5
const Fs4 = 66, Cs5 = 73, D5 = 74;
const _D4 = 62, _E4 = 64, _G4 = 67, _A4 = 69, _B4 = 71;

// Musette - J.S. Bach (from Notebook for Anna Magdalena Bach)
// Suzuki Book 1 arrangement, white keys only
// In D major originally, simplified to C major for white keys
const melody: [number, MidiNote, number][] = [
  // Section A
  // Phrase 1: D E F G A
  [0, D4, 0.5], [0.5, E4, 0.5], [1, F4, 0.5], [1.5, G4, 0.5], [2, A4, 1],
  // Phrase 2: G F E D C
  [3, G4, 0.5], [3.5, F4, 0.5], [4, E4, 0.5], [4.5, D4, 0.5], [5, C4, 1],
  // Phrase 3: D E F G A
  [6, D4, 0.5], [6.5, E4, 0.5], [7, F4, 0.5], [7.5, G4, 0.5], [8, A4, 1],
  // Phrase 4: B A G F E | D --
  [9, B4, 0.5], [9.5, A4, 0.5], [10, G4, 0.5], [10.5, F4, 0.5], [11, E4, 1],
  [12, D4, 2],
  // Section B (variation)
  // Phrase 5: A B C5 B A
  [14, A4, 0.5], [14.5, B4, 0.5], [15, C5, 0.5], [15.5, B4, 0.5], [16, A4, 1],
  // Phrase 6: G A B A G
  [17, G4, 0.5], [17.5, A4, 0.5], [18, B4, 0.5], [18.5, A4, 0.5], [19, G4, 1],
  // Phrase 7: F G A G F
  [20, F4, 0.5], [20.5, G4, 0.5], [21, A4, 0.5], [21.5, G4, 0.5], [22, F4, 1],
  // Phrase 8: E F G F E | D --
  [23, E4, 0.5], [23.5, F4, 0.5], [24, G4, 0.5], [24.5, F4, 0.5], [25, E4, 1],
  [26, D4, 2],
  // Section A return (abbreviated)
  // Phrase 9: D E F G A
  [28, D4, 0.5], [28.5, E4, 0.5], [29, F4, 0.5], [29.5, G4, 0.5], [30, A4, 1],
  // Phrase 10: B A G F E | D --
  [31, B4, 0.5], [31.5, A4, 0.5], [32, G4, 0.5], [32.5, F4, 0.5], [33, E4, 0.5],
  [33.5, D4, 0.5], [34, C4, 0.5], [34.5, D4, 0.5], [35, D4, 2],
];

// Authentic D major melody (+2 semitones from C major)
const pianoMelody: [number, MidiNote, number][] = [
  // Section A
  // Phrase 1: E F# G A B
  [0, _E4, 0.5], [0.5, Fs4, 0.5], [1, _G4, 0.5], [1.5, _A4, 0.5], [2, _B4, 1],
  // Phrase 2: A G F# E D
  [3, _A4, 0.5], [3.5, _G4, 0.5], [4, Fs4, 0.5], [4.5, _E4, 0.5], [5, _D4, 1],
  // Phrase 3: E F# G A B
  [6, _E4, 0.5], [6.5, Fs4, 0.5], [7, _G4, 0.5], [7.5, _A4, 0.5], [8, _B4, 1],
  // Phrase 4: C# B A G F# | E --
  [9, Cs5, 0.5], [9.5, _B4, 0.5], [10, _A4, 0.5], [10.5, _G4, 0.5], [11, Fs4, 1],
  [12, _E4, 2],
  // Section B (variation)
  // Phrase 5: B C# D5 C# B
  [14, _B4, 0.5], [14.5, Cs5, 0.5], [15, D5, 0.5], [15.5, Cs5, 0.5], [16, _B4, 1],
  // Phrase 6: A B C# B A
  [17, _A4, 0.5], [17.5, _B4, 0.5], [18, Cs5, 0.5], [18.5, _B4, 0.5], [19, _A4, 1],
  // Phrase 7: G A B A G
  [20, _G4, 0.5], [20.5, _A4, 0.5], [21, _B4, 0.5], [21.5, _A4, 0.5], [22, _G4, 1],
  // Phrase 8: F# G A G F# | E --
  [23, Fs4, 0.5], [23.5, _G4, 0.5], [24, _A4, 0.5], [24.5, _G4, 0.5], [25, Fs4, 1],
  [26, _E4, 2],
  // Section A return (abbreviated)
  // Phrase 9: E F# G A B
  [28, _E4, 0.5], [28.5, Fs4, 0.5], [29, _G4, 0.5], [29.5, _A4, 0.5], [30, _B4, 1],
  // Phrase 10: C# B A G F# | E D E E --
  [31, Cs5, 0.5], [31.5, _B4, 0.5], [32, _A4, 0.5], [32.5, _G4, 0.5], [33, Fs4, 0.5],
  [33.5, _E4, 0.5], [34, _D4, 0.5], [34.5, _E4, 0.5], [35, _E4, 2],
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

export const musette: Song = {
  id: 'suzuki-musette',
  title: 'Musette',
  artist: 'J.S. Bach',
  difficulty: 'Medium',
  bpm: BPM,
  noteRange: { lowest: 60, highest: 72, whiteKeysOnly: true },
  notes,
  pianoNotes,
  pianoNoteRange: { lowest: 62, highest: 74, whiteKeysOnly: false },
};
