import { MidiNote } from '@/types/game';
import { isWhiteKey } from '@/constants/keyboard';

/**
 * Position of a single piano key as a fraction (0-1) of total width.
 */
export interface PianoKeyPos {
  x: number;       // left edge, 0-1
  width: number;   // 0-1
  center: number;  // center x, 0-1
  isBlack: boolean;
}

// Standard 49-key MIDI keyboard range (Axiom 49, etc.)
export const MIDI_49_LOWEST: MidiNote = 36;  // C2
export const MIDI_49_HIGHEST: MidiNote = 84; // C6

/**
 * Compute x-positions for every key in a MIDI range, using real piano layout:
 * - White keys: equally spaced across full width
 * - Black keys: narrower, centered between adjacent white keys
 */
export function computePianoPositions(
  lowest: MidiNote,
  highest: MidiNote,
): Map<MidiNote, PianoKeyPos> {
  const allNotes: MidiNote[] = [];
  for (let n = lowest; n <= highest; n++) allNotes.push(n);

  const whiteNotes = allNotes.filter(n => isWhiteKey(n));
  const blackNotes = allNotes.filter(n => !isWhiteKey(n));

  if (whiteNotes.length === 0) return new Map();

  const wkWidth = 1 / whiteNotes.length;
  const bkWidth = wkWidth * 0.6;

  const whiteIdx = new Map<MidiNote, number>();
  whiteNotes.forEach((n, i) => whiteIdx.set(n, i));

  const positions = new Map<MidiNote, PianoKeyPos>();

  // White keys: evenly spaced
  whiteNotes.forEach((note, i) => {
    const x = i * wkWidth;
    positions.set(note, { x, width: wkWidth, center: x + wkWidth / 2, isBlack: false });
  });

  // Black keys: centered at the boundary between adjacent white keys
  blackNotes.forEach(note => {
    const lowerWhite = note - 1;
    const idx = whiteIdx.get(lowerWhite);
    if (idx !== undefined) {
      const rightEdge = (idx + 1) * wkWidth;
      const x = rightEdge - bkWidth / 2;
      positions.set(note, { x, width: bkWidth, center: x + bkWidth / 2, isBlack: true });
    }
  });

  return positions;
}
