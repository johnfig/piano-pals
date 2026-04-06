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
 * Resolve which note set to use based on MIDI connection status.
 * When MIDI is connected and pianoNotes exist, use the authentic version.
 * Otherwise fall back to the simplified keyboard version.
 * In MIDI mode, all notes are shifted down 1 octave so songs play
 * from the middle of the keyboard, not the top.
 */
export function resolveSongData(
  song: Song,
  midiConnected: boolean,
): ResolvedSongData {
  const usePiano = midiConnected && !!song.pianoNotes;
  const baseNotes = usePiano ? song.pianoNotes! : song.notes;
  const baseRange = usePiano ? (song.pianoNoteRange ?? song.noteRange) : song.noteRange;

  if (midiConnected) {
    return {
      notes: shiftNotes(baseNotes, MIDI_OCTAVE_SHIFT),
      noteRange: shiftRange(baseRange, MIDI_OCTAVE_SHIFT),
      isMidiMode: true,
    };
  }

  return {
    notes: baseNotes,
    noteRange: baseRange,
    isMidiMode: false,
  };
}
