'use client';

import { useState, useEffect, useCallback } from 'react';
import { Song, MidiNote } from '@/types/game';
import { midiNoteToName } from '@/constants/keyboard';
import AudioEngine from '@/engine/AudioEngine';
import InputManager from '@/engine/InputManager';
import PianoKeyboard from './PianoKeyboard';

interface WarmupProps {
  song: Song;
  activeLanes: MidiNote[];
  keyLabels: Map<MidiNote, string>;
  displayRange?: { lowest: MidiNote; highest: MidiNote };
  inputManager: InputManager;
  isMidiMode: boolean;
  onStart: () => void;
  onBack: () => void;
}

export default function Warmup({
  song,
  activeLanes,
  keyLabels,
  displayRange,
  inputManager,
  isMidiMode,
  onStart,
  onBack,
}: WarmupProps) {
  const [pressedNotes, setPressedNotes] = useState<Set<MidiNote>>(new Set());
  const [lastNote, setLastNote] = useState<string | null>(null);

  // Wire up input to play audio (no scoring)
  useEffect(() => {
    const audio = AudioEngine.getInstance();
    const input = inputManager;

    input.setActiveLanes(activeLanes);

    input.onKeyDown = (midiNote: MidiNote) => {
      audio.startNote(midiNote);
      setPressedNotes(prev => new Set(prev).add(midiNote));
      setLastNote(midiNoteToName(midiNote));
    };

    input.onKeyUp = (midiNote: MidiNote) => {
      audio.stopNote(midiNote);
      setPressedNotes(prev => {
        const next = new Set(prev);
        next.delete(midiNote);
        return next;
      });
    };

    input.start();

    return () => {
      input.stop();
      audio.stopAllNotes();
    };
  }, [inputManager, activeLanes]);

  // Enter = start, Escape = back
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Enter') {
      e.preventDefault();
      onStart();
    } else if (e.code === 'Escape') {
      onBack();
    }
  }, [onStart, onBack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 bg-[#0F0B1A] flex flex-col items-center z-30">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">{song.title}</h2>
          <p className="text-white/50 text-sm">{song.artist}</p>
        </div>

        {/* Note feedback */}
        <div className="h-16 flex items-center justify-center">
          {lastNote ? (
            <span className="text-4xl font-bold text-coral-400 animate-pulse">{lastNote}</span>
          ) : (
            <span className="text-white/30 text-lg">Play the keys to find your octave</span>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          className="px-10 py-3 rounded-xl bg-coral-500 hover:bg-coral-400 text-white font-bold text-lg transition-colors shadow-lg shadow-coral-500/25"
        >
          Start
        </button>
        <p className="text-white/30 text-xs">Press Enter to start &middot; Esc to go back</p>
      </div>

      {/* Piano keyboard */}
      <PianoKeyboard
        activeLanes={activeLanes}
        keyLabels={keyLabels}
        pressedNotes={pressedNotes}
        hitLanes={new Set()}
        isMidiMode={isMidiMode}
        displayRange={displayRange}
      />
    </div>
  );
}
