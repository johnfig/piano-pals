'use client';

import { useState } from 'react';
import { Song } from '@/types/game';
import { InstrumentType } from '@/engine/AudioEngine';

export type SpeedOption = 0.5 | 0.75 | 1 | 1.5 | 2;

interface SpeedSelectProps {
  song: Song;
  isMidiMode: boolean;
  onStart: (speed: SpeedOption, twoHands: boolean, instrument: InstrumentType) => void;
  onAutoplay: (speed: SpeedOption, instrument: InstrumentType) => void;
  onBack: () => void;
}

const SPEEDS: { value: SpeedOption; label: string; desc: string; color: string }[] = [
  { value: 0.5, label: '0.5x', desc: 'Super Slow', color: 'from-[#FF6B6B] to-[#E85555]' },
  { value: 0.75, label: '0.75x', desc: 'Slow', color: 'from-[#FF6B6B] to-[#E85555]' },
  { value: 1, label: '1x', desc: 'Normal', color: 'from-[#FF6B6B] to-[#E85555]' },
];

const DEMO_SPEEDS: { value: SpeedOption; label: string }[] = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

export default function SpeedSelect({ song, isMidiMode, onStart, onAutoplay, onBack }: SpeedSelectProps) {
  const [twoHands, setTwoHands] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  const [demoSpeed, setDemoSpeed] = useState<SpeedOption>(1);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0F0B1A] z-50 p-4 overflow-y-auto">
      <div className="text-center max-w-sm w-full space-y-6 py-8">
        {/* Song info */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{song.artist}</p>
          <h2 className="text-3xl font-black text-white">{song.title}</h2>
          <div className="flex justify-center gap-3 mt-2 text-sm text-gray-500">
            <span>{song.notes.length} notes</span>
            <span>{song.difficulty}</span>
          </div>
        </div>

        {/* Hand mode toggle */}
        <div className="space-y-2">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
            Hand Mode
          </p>
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button
              onClick={() => setTwoHands(false)}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-all ${
                !twoHands
                  ? 'bg-blue-500/20 text-blue-300 border-r border-blue-500/30'
                  : 'bg-[#1A1530] text-gray-500 border-r border-white/10 hover:bg-white/5'
              }`}
            >
              <span className="block text-lg mb-0.5">One Hand</span>
              <span className="block text-[10px] opacity-70">Melody only</span>
            </button>
            <button
              onClick={() => setTwoHands(true)}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-all ${
                twoHands
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-[#1A1530] text-gray-500 hover:bg-white/5'
              }`}
            >
              <span className="block text-lg mb-0.5">Two Hands</span>
              <span className="block text-[10px] opacity-70">Melody + Bass</span>
            </button>
          </div>
        </div>

        {/* Instrument selector */}
        <div className="space-y-2">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
            Sound
          </p>
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button
              onClick={() => setInstrument('piano')}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold transition-all ${
                instrument === 'piano'
                  ? 'bg-amber-500/20 text-amber-300 border-r border-amber-500/30'
                  : 'bg-[#1A1530] text-gray-500 border-r border-white/10 hover:bg-white/5'
              }`}
            >
              Piano
            </button>
            <button
              onClick={() => setInstrument('electric')}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold transition-all ${
                instrument === 'electric'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-[#1A1530] text-gray-500 hover:bg-white/5'
              }`}
            >
              Electric Piano
            </button>
          </div>
        </div>

        {/* Speed options */}
        <div className="space-y-3">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
            Choose Speed
          </p>

          {SPEEDS.map(({ value, label, desc, color }) => (
            <button
              key={value}
              onClick={() => onStart(value, twoHands, instrument)}
              className="w-full group relative overflow-hidden rounded-xl border border-white/10 bg-[#1A1530] px-6 py-4 text-left transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                    {label}
                  </span>
                  <span className="text-gray-400 text-sm">{desc}</span>
                </div>
                {value === 1 ? (
                  <span className="text-xs text-[#FF6B6B] px-2 py-0.5 rounded-full bg-[#FF6B6B]/10">
                    Full XP
                  </span>
                ) : (
                  <span className="text-xs text-white/50 px-2 py-0.5 rounded-full bg-white/5">
                    Practice
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B]/0 via-[#FF6B6B]/5 to-[#FF6B6B]/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          ))}
        </div>

        {/* Watch Demo */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
            Watch Demo
          </p>
          <div className="flex gap-2 justify-center">
            {DEMO_SPEEDS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDemoSpeed(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  demoSpeed === value
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-[#1A1530] text-gray-500 border border-white/10 hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => onAutoplay(demoSpeed, instrument)}
            className="w-full group relative overflow-hidden rounded-xl border border-purple-500/20 bg-purple-500/10 px-6 py-3 text-center transition-all hover:bg-purple-500/20 hover:border-purple-500/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg">👁</span>
              <span className="text-purple-300 font-bold">Watch at {DEMO_SPEEDS.find(s => s.value === demoSpeed)?.label}</span>
            </div>
            <p className="text-purple-400/60 text-xs mt-1">See & hear the song played perfectly — no XP</p>
          </button>
        </div>

        {/* Back */}
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-300 text-sm transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
