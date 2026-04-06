import { Song, SongNote, NoteRange } from '@/types/game';

export interface ResolvedSongData {
  notes: SongNote[];
  noteRange: NoteRange;
  isMidiMode: boolean;
}

// Shift notes down 1 octave in MIDI mode so songs sit in the middle
// of a 49-key keyboard instead of the top.
const MIDI_OCTAVE_SHIFT = -12;

function shiftNotes(notes: SongNote[], semitones: number): SongNote[] {
  return notes.map(n => ({ ...n, note: n.note + semitones }));
}

function shiftRange(range: NoteRange, semitones: number): NoteRange {
  return { ...range, lowest: range.lowest + semitones, highest: range.highest + semitones };
}

/**
 * Auto-generate simple left-hand bass accompaniment.
 * Uses I-IV-V chord roots based on the melody note at each measure start.
 * Bass notes are placed 1 octave below the song's tonic.
 */
function generateBassAccompaniment(
  notes: SongNote[],
  noteRange: NoteRange,
  bpm: number,
): SongNote[] {
  if (notes.length === 0) return [];

  const beatDuration = 60 / bpm;
  const measureDuration = beatDuration * 4; // 4/4 time

  // Tonic = lowest note in the melody range
  const tonic = noteRange.lowest;
  const tonicPitchClass = tonic % 12;

  // Bass roots: I, IV, V — one octave below tonic
  const bassI = tonic - 12;       // tonic
  const bassIV = tonic - 12 + 5;  // perfect fourth above bass tonic
  const bassV = tonic - 12 + 7;   // perfect fifth above bass tonic

  const lastNoteTime = notes[notes.length - 1]?.time ?? 0;
  const numMeasures = Math.ceil(lastNoteTime / measureDuration) + 1;

  const bassNotes: SongNote[] = [];

  for (let m = 0; m < numMeasures; m++) {
    const measureStart = m * measureDuration;

    // Find first melody note in this measure to determine chord
    const melodyNote = notes.find(
      n => n.time >= measureStart - 0.01 && n.time < measureStart + measureDuration,
    );
    if (!melodyNote) continue;

    // Determine chord from melody note's interval above tonic
    const interval = ((melodyNote.note % 12) - tonicPitchClass + 12) % 12;
    let bassNote: number;
    if (interval === 0 || interval === 4 || interval === 7) {
      // Root, major 3rd, or 5th → I chord
      bassNote = bassI;
    } else if (interval === 5 || interval === 9) {
      // 4th or 6th → IV chord
      bassNote = bassIV;
    } else {
      // 2nd, minor 3rd, 7th, etc. → V chord
      bassNote = bassV;
    }

    // Play bass as a whole note (one per measure)
    bassNotes.push({
      time: measureStart,
      note: bassNote,
      duration: measureDuration * 0.9,
    });
  }

  return bassNotes;
}

/**
 * Resolve which note set to use based on MIDI connection status.
 * When MIDI is connected:
 * - Uses authentic pianoNotes if available, otherwise simplified notes
 * - Adds left-hand bass accompaniment for two-hand playing
 * - Shifts everything down 1 octave for comfortable center-keyboard position
 */
export function resolveSongData(
  song: Song,
  midiConnected: boolean,
): ResolvedSongData {
  const usePiano = midiConnected && !!song.pianoNotes;
  const baseNotes = usePiano ? song.pianoNotes! : song.notes;
  const baseRange = usePiano ? (song.pianoNoteRange ?? song.noteRange) : song.noteRange;

  if (midiConnected) {
    // Generate left-hand bass accompaniment
    const bassNotes = generateBassAccompaniment(baseNotes, baseRange, song.bpm);
    const allNotes = [...baseNotes, ...bassNotes].sort((a, b) => a.time - b.time);

    // Expand range to include bass (1 octave below tonic)
    const bassLowest = baseRange.lowest - 12;
    const expandedRange: NoteRange = {
      lowest: bassLowest,
      highest: baseRange.highest,
      whiteKeysOnly: baseRange.whiteKeysOnly,
    };

    // Shift everything down 1 octave for center-keyboard playing
    return {
      notes: shiftNotes(allNotes, MIDI_OCTAVE_SHIFT),
      noteRange: shiftRange(expandedRange, MIDI_OCTAVE_SHIFT),
      isMidiMode: true,
    };
  }

  return {
    notes: baseNotes,
    noteRange: baseRange,
    isMidiMode: false,
  };
}
