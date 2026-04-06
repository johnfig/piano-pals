'use client';

import { MidiNote } from '@/types/game';
import { midiNoteToName, isWhiteKey } from '@/constants/keyboard';
import { getLaneColor } from '@/constants/colors';
import { MIDI_49_LOWEST, MIDI_49_HIGHEST } from '@/utils/pianoPositions';

interface PianoKeyboardProps {
  activeLanes: MidiNote[];
  keyLabels: Map<MidiNote, string>;
  pressedNotes: Set<MidiNote>;
  hitLanes: Set<number>;
  isMidiMode: boolean;
}

const WHITE_KEY_HEIGHT = 80;
const BLACK_KEY_HEIGHT = 50;

/**
 * Build the full 49-key range (C2-C6) for MIDI keyboard display.
 */
function buildFullKeyboardRange(): MidiNote[] {
  const all: MidiNote[] = [];
  for (let n = MIDI_49_LOWEST; n <= MIDI_49_HIGHEST; n++) {
    all.push(n);
  }
  return all;
}

export default function PianoKeyboard({ activeLanes, keyLabels, pressedNotes, hitLanes, isMidiMode }: PianoKeyboardProps) {
  // In MIDI mode, show the full 49-key keyboard (1:1 with physical Axiom 49)
  if (isMidiMode) {
    const fullRange = buildFullKeyboardRange();
    const activeSet = new Set(activeLanes);
    return <PianoLayout
      allNotes={fullRange}
      activeLanes={activeLanes}
      activeSet={activeSet}
      keyLabels={keyLabels}
      pressedNotes={pressedNotes}
      hitLanes={hitLanes}
    />;
  }

  // If the song itself has black keys in activeLanes (keyboard mode with sharps)
  const hasBlackKeys = activeLanes.some(n => !isWhiteKey(n));
  if (hasBlackKeys) {
    const activeSet = new Set(activeLanes);
    return <PianoLayout
      allNotes={activeLanes}
      activeLanes={activeLanes}
      activeSet={activeSet}
      keyLabels={keyLabels}
      pressedNotes={pressedNotes}
      hitLanes={hitLanes}
    />;
  }

  // Keyboard mode: white keys only, equal width, with keyboard labels
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex" style={{ height: WHITE_KEY_HEIGHT }}>
      {activeLanes.map((midiNote, lane) => {
        const isPressed = pressedNotes.has(midiNote);
        const isHit = hitLanes.has(lane);
        const color = getLaneColor(lane);
        const label = keyLabels.get(midiNote) ?? '';
        const noteName = midiNoteToName(midiNote);

        return (
          <div
            key={lane}
            className="flex-1 relative"
            style={{ height: WHITE_KEY_HEIGHT }}
          >
            <div
              className="absolute inset-0 transition-colors duration-75"
              style={{
                background: isPressed
                  ? `linear-gradient(to bottom, ${color}50, ${color}30)`
                  : isHit
                    ? `linear-gradient(to bottom, ${color}25, ${color}15)`
                    : 'linear-gradient(to bottom, #e8e8e8, #d4d4d4)',
                borderLeft: '1px solid rgba(0,0,0,0.15)',
                borderRight: '1px solid rgba(0,0,0,0.15)',
                borderBottom: '3px solid rgba(0,0,0,0.2)',
                borderRadius: '0 0 4px 4px',
                boxShadow: isPressed
                  ? `inset 0 0 12px ${color}40, inset 0 2px 8px rgba(0,0,0,0.2)`
                  : 'inset 0 -2px 4px rgba(0,0,0,0.08)',
              }}
            />
            {isPressed && (
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: color }}
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 pointer-events-none">
              {label && (
                <span
                  className="text-sm font-bold"
                  style={{ color: isPressed ? color : 'rgba(0,0,0,0.35)' }}
                >
                  {label}
                </span>
              )}
              <span
                className="text-[9px] mt-0.5"
                style={{ color: isPressed ? color : 'rgba(0,0,0,0.25)' }}
              >
                {noteName}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Realistic piano layout with overlapping black keys.
 * Shows ALL notes in the range as piano keys. Notes not in activeLanes
 * appear as inactive (dimmed) keys. Any key in pressedNotes lights up.
 */
function PianoLayout({
  allNotes,
  activeLanes,
  activeSet,
  keyLabels,
  pressedNotes,
  hitLanes,
}: {
  allNotes: MidiNote[];
  activeLanes: MidiNote[];
  activeSet: Set<MidiNote>;
  keyLabels: Map<MidiNote, string>;
  pressedNotes: Set<MidiNote>;
  hitLanes: Set<number>;
}) {
  const whiteNotes = allNotes.filter(n => isWhiteKey(n));
  const blackNotes = allNotes.filter(n => !isWhiteKey(n));

  if (whiteNotes.length === 0) return null;

  const whiteKeyWidth = 100 / whiteNotes.length; // percentage
  const blackKeyWidth = whiteKeyWidth * 0.6;

  // Map each white key to its index for positioning
  const whiteKeyIndex = new Map<MidiNote, number>();
  whiteNotes.forEach((note, i) => whiteKeyIndex.set(note, i));

  // Build position map for all keys
  const keyPositions = new Map<MidiNote, { x: number; width: number }>();

  // White keys: evenly spaced
  whiteNotes.forEach((note, i) => {
    keyPositions.set(note, { x: i * whiteKeyWidth, width: whiteKeyWidth });
  });

  // Black keys: centered between adjacent white keys
  blackNotes.forEach(note => {
    const lowerWhite = note - 1;
    const idx = whiteKeyIndex.get(lowerWhite);
    if (idx !== undefined) {
      const rightEdge = (idx + 1) * whiteKeyWidth;
      keyPositions.set(note, { x: rightEdge - blackKeyWidth / 2, width: blackKeyWidth });
    }
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30" style={{ height: WHITE_KEY_HEIGHT }}>
      {/* White keys layer */}
      {whiteNotes.map((midiNote) => {
        const isActive = activeSet.has(midiNote);
        const lane = activeLanes.indexOf(midiNote);
        const isPressed = pressedNotes.has(midiNote);
        const isHit = lane >= 0 && hitLanes.has(lane);
        // Use 6-char hex so appending alpha (e.g. "60") produces valid 8-char CSS hex
        const color = lane >= 0 ? getLaneColor(lane) : '#888888';
        const label = keyLabels.get(midiNote) ?? '';
        const noteName = midiNoteToName(midiNote);
        const pos = keyPositions.get(midiNote);
        const isC = midiNote % 12 === 0;
        const octave = Math.floor(midiNote / 12) - 1;
        if (!pos) return null;

        return (
          <div
            key={`white-${midiNote}`}
            className="absolute top-0"
            style={{
              left: `${pos.x}%`,
              width: `${pos.width}%`,
              height: WHITE_KEY_HEIGHT,
            }}
          >
            {/* White key background — only the LOWER portion (below black key zone) shows highlight */}
            <div
              className="absolute inset-0 transition-colors duration-75"
              style={{
                background: isActive
                  ? 'linear-gradient(to bottom, #e8e8e8, #f0f0f0, #d8d8d8)'
                  : 'linear-gradient(to bottom, #c0c0c0, #c8c8c8, #b0b0b0)',
                borderLeft: '1px solid rgba(0,0,0,0.12)',
                borderRight: '1px solid rgba(0,0,0,0.12)',
                borderBottom: '4px solid rgba(0,0,0,0.15)',
                borderRadius: '0 0 5px 5px',
                boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.06)',
                opacity: isActive ? 1 : 0.5,
              }}
            />
            {/* Pressed highlight — only in the LOWER section (below black keys) */}
            {isPressed && (
              <div
                className="absolute left-0 right-0 transition-colors duration-75"
                style={{
                  top: BLACK_KEY_HEIGHT,
                  bottom: 0,
                  background: `linear-gradient(to bottom, ${color}50, ${color}30)`,
                  borderRadius: '0 0 5px 5px',
                }}
              />
            )}
            {isHit && !isPressed && (
              <div
                className="absolute left-0 right-0"
                style={{
                  top: BLACK_KEY_HEIGHT,
                  bottom: 0,
                  background: `linear-gradient(to bottom, ${color}20, ${color}10)`,
                  borderRadius: '0 0 5px 5px',
                }}
              />
            )}
            {/* Pressed bottom-edge indicator */}
            {isPressed && (
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t"
                style={{ height: 3, backgroundColor: color }}
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 pointer-events-none">
              {label && (
                <span
                  className="text-xs font-bold"
                  style={{ color: isPressed ? color : 'rgba(0,0,0,0.3)' }}
                >
                  {label}
                </span>
              )}
              {isC && (
                <span
                  className="text-[8px] font-semibold mt-0.5"
                  style={{ color: isPressed ? color : isActive ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)' }}
                >
                  C{octave}
                </span>
              )}
              {!isC && isActive && (
                <span
                  className="text-[8px] mt-0.5"
                  style={{ color: isPressed ? color : 'rgba(0,0,0,0.15)' }}
                >
                  {noteName}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Black keys layer (rendered on top) */}
      {blackNotes.map((midiNote) => {
        const isActive = activeSet.has(midiNote);
        const lane = activeLanes.indexOf(midiNote);
        const isPressed = pressedNotes.has(midiNote);
        const isHit = lane >= 0 && hitLanes.has(lane);
        // Use 6-char hex so appending alpha produces valid CSS
        const color = lane >= 0 ? getLaneColor(lane) : (isPressed ? '#aaaaaa' : '#888888');
        const label = keyLabels.get(midiNote) ?? '';
        const noteName = midiNoteToName(midiNote);
        const pos = keyPositions.get(midiNote);
        if (!pos) return null;

        return (
          <div
            key={`black-${midiNote}`}
            className="absolute top-0 z-10"
            style={{
              left: `${pos.x}%`,
              width: `${pos.width}%`,
              height: BLACK_KEY_HEIGHT,
            }}
          >
            <div
              className="absolute inset-0 transition-colors duration-75"
              style={{
                background: isPressed
                  ? `linear-gradient(to bottom, ${color}90, ${color}50)`
                  : isHit
                    ? `linear-gradient(to bottom, ${color}30, ${color}20)`
                    : 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)',
                borderLeft: '1px solid rgba(0,0,0,0.4)',
                borderRight: '1px solid rgba(0,0,0,0.4)',
                borderBottom: '3px solid rgba(0,0,0,0.7)',
                borderRadius: '0 0 4px 4px',
                boxShadow: isPressed
                  ? `0 0 8px ${color}60`
                  : '0 3px 8px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(0,0,0,0.3)',
                opacity: isActive ? 1 : (isPressed ? 0.9 : 0.4),
              }}
            />
            {isPressed && (
              <div
                className="absolute bottom-1 left-1 right-1 rounded"
                style={{ height: 2, backgroundColor: color }}
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1.5 pointer-events-none">
              {label && (
                <span
                  className="text-[10px] font-bold"
                  style={{ color: isPressed ? color : 'rgba(255,255,255,0.3)' }}
                >
                  {label}
                </span>
              )}
              {isActive && (
                <span
                  className="text-[8px] mt-0.5"
                  style={{ color: isPressed ? color : 'rgba(255,255,255,0.2)' }}
                >
                  {noteName}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
