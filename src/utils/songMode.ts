import { Song, SongNote, NoteRange } from '@/types/game';

/**
 * All songs are authored in octave 4 (C4=60) for sheet-music clarity,
 * but the physical keyboard plays best with right hand around C3 (MIDI 48).
 * This offset shifts everything down one octave at resolution time.
 */
const OCTAVE_OFFSET = -12;

export interface ResolvedSongData {
  notes: SongNote[];
  noteRange: NoteRange;
  isMidiMode: boolean;
}

/** Shift a note array by a semitone offset */
function shiftNotes(notes: SongNote[], offset: number): SongNote[] {
  if (offset === 0) return notes;
  return notes.map(n => ({ ...n, note: n.note + offset }));
}

/** Shift a note range by a semitone offset */
function shiftRange(range: NoteRange, offset: number): NoteRange {
  if (offset === 0) return range;
  return { ...range, lowest: range.lowest + offset, highest: range.highest + offset };
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

  const tonic = noteRange.lowest;
  const tonicPitchClass = tonic % 12;

  // Bass roots: I, IV, V — one octave below tonic
  const bassI = tonic - 12;
  const bassIV = tonic - 12 + 5;
  const bassV = tonic - 12 + 7;

  const lastNoteTime = notes[notes.length - 1]?.time ?? 0;
  const numMeasures = Math.ceil(lastNoteTime / measureDuration) + 1;

  const bassNotes: SongNote[] = [];

  for (let m = 0; m < numMeasures; m++) {
    const measureStart = m * measureDuration;

    const melodyNote = notes.find(
      n => n.time >= measureStart - 0.01 && n.time < measureStart + measureDuration,
    );
    if (!melodyNote) continue;

    const interval = ((melodyNote.note % 12) - tonicPitchClass + 12) % 12;
    let bassNote: number;
    if (interval === 0 || interval === 4 || interval === 7) {
      bassNote = bassI;
    } else if (interval === 5 || interval === 9) {
      bassNote = bassIV;
    } else {
      bassNote = bassV;
    }

    bassNotes.push({
      time: measureStart,
      note: bassNote,
      duration: measureDuration * 0.9,
    });
  }

  return bassNotes;
}

/**
 * Resolve which note set to use based on hand mode.
 *
 * - One-hand (twoHands=false): `notes` = right hand melody only
 * - Two-hand (twoHands=true): `pianoNotes` if available (real arrangement with both hands),
 *   otherwise auto-generate bass accompaniment from the melody
 */
export function resolveSongData(
  song: Song,
  midiConnected: boolean,
  twoHands: boolean = false,
): ResolvedSongData {
  // Apply octave offset so keys sit around C3 on the physical keyboard
  const baseNotes = shiftNotes(song.notes, OCTAVE_OFFSET);
  const baseRange = shiftRange(song.noteRange, OCTAVE_OFFSET);

  if (twoHands) {
    if (song.pianoNotes && song.pianoNoteRange) {
      // Real two-hand arrangement provided — use it directly
      const twoHandNotes = shiftNotes(song.pianoNotes, OCTAVE_OFFSET);
      const twoHandRange = shiftRange(song.pianoNoteRange, OCTAVE_OFFSET);
      return { notes: twoHandNotes, noteRange: twoHandRange, isMidiMode: midiConnected };
    }
    // Fallback: auto-generate bass from the melody
    const bassNotes = generateBassAccompaniment(baseNotes, baseRange, song.bpm);
    const allNotes = [...baseNotes, ...bassNotes].sort((a, b) => a.time - b.time);
    const expandedRange: NoteRange = {
      lowest: baseRange.lowest - 12,
      highest: baseRange.highest,
      whiteKeysOnly: baseRange.whiteKeysOnly,
    };
    return { notes: allNotes, noteRange: expandedRange, isMidiMode: midiConnected };
  }

  // One-hand mode: melody only (RH)
  return { notes: baseNotes, noteRange: baseRange, isMidiMode: midiConnected };
}
