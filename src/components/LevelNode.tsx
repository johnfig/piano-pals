'use client';

import { SongProgress } from '@/types/game';
import { TrackLevel } from '@/types/tracks';

interface LevelNodeProps {
  level: TrackLevel;
  songProgress: SongProgress | undefined;
  isUnlocked: boolean;
  isCurrentLevel: boolean;
  trackColor: string;
  onClick: () => void;
}

export default function LevelNode({
  level,
  songProgress,
  isUnlocked,
  isCurrentLevel,
  trackColor,
  onClick,
}: LevelNodeProps) {
  const stars = songProgress?.stars ?? 0;
  const isCompleted = stars > 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Speech bubble for current level */}
      {isCurrentLevel && !isCompleted && (
        <div className="relative mb-1 animate-bounce">
          <div
            className="px-4 py-1.5 rounded-xl font-black text-sm uppercase tracking-wider text-white shadow-lg"
            style={{
              backgroundColor: trackColor,
              boxShadow: `0 4px 15px ${trackColor}60`,
            }}
          >
            START
          </div>
          {/* Speech bubble arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `8px solid ${trackColor}`,
            }}
          />
        </div>
      )}

      {/* Main node button */}
      <button
        onClick={onClick}
        disabled={!isUnlocked}
        className={`relative group transition-transform ${
          isUnlocked ? 'active:scale-90 hover:scale-105' : ''
        }`}
        style={{ width: isCurrentLevel ? 88 : 72, height: isCurrentLevel ? 88 : 72 }}
      >
        {/* Pulsing ring for current level */}
        {isCurrentLevel && (
          <>
            <div
              className="absolute inset-[-8px] rounded-full animate-ping opacity-20"
              style={{ backgroundColor: trackColor }}
            />
            <div
              className="absolute inset-[-6px] rounded-full animate-pulse"
              style={{
                border: `3px solid ${trackColor}`,
                opacity: 0.6,
              }}
            />
          </>
        )}

        {/* Completed: Gold coin look */}
        {isCompleted && (
          <>
            {/* Bottom shadow for 3D depth */}
            <div
              className="absolute inset-0 rounded-full translate-y-1.5"
              style={{ backgroundColor: '#b8860b' }}
            />
            {/* Main gold body */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(145deg, #ffd700 0%, #f0c020 40%, #daa520 100%)',
                boxShadow: '0 2px 10px rgba(255, 215, 0, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              }}
            />
            {/* Inner ring */}
            <div
              className="absolute inset-2 rounded-full"
              style={{
                border: '2px solid rgba(255,255,255,0.25)',
              }}
            />
            {/* Checkmark */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {/* Shine highlight */}
            <div
              className="absolute top-1 left-3 w-5 h-3 rounded-full"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)',
              }}
            />
          </>
        )}

        {/* Current level: Vibrant track-colored node */}
        {isCurrentLevel && !isCompleted && (
          <>
            {/* Bottom shadow */}
            <div
              className="absolute inset-0 rounded-full translate-y-1.5"
              style={{ backgroundColor: trackColor, filter: 'brightness(0.6)' }}
            />
            {/* Main body */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(145deg, ${trackColor}, ${trackColor}cc)`,
                boxShadow: `0 4px 20px ${trackColor}50, inset 0 2px 4px rgba(255,255,255,0.2)`,
              }}
            />
            {/* Inner ring */}
            <div
              className="absolute inset-2 rounded-full"
              style={{ border: '2px solid rgba(255,255,255,0.2)' }}
            />
            {/* Level number with star */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white/60 text-xs">★</span>
              <span className="text-white font-black text-xl -mt-0.5 drop-shadow-sm">{level.levelNumber}</span>
            </div>
            {/* Shine */}
            <div
              className="absolute top-1.5 left-4 w-6 h-3 rounded-full"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)',
              }}
            />
          </>
        )}

        {/* Unlocked but not started: Subtle colored node */}
        {isUnlocked && !isCompleted && !isCurrentLevel && (
          <>
            {/* Bottom shadow */}
            <div className="absolute inset-0 rounded-full translate-y-1 bg-white/5" />
            {/* Main body */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(145deg, ${trackColor}30, ${trackColor}15)`,
                border: `2px solid ${trackColor}40`,
                boxShadow: `inset 0 2px 3px rgba(255,255,255,0.05)`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/70 font-bold text-lg">{level.levelNumber}</span>
            </div>
          </>
        )}

        {/* Locked: Gray with depth */}
        {!isUnlocked && (
          <>
            {/* Bottom shadow */}
            <div className="absolute inset-0 rounded-full translate-y-1" style={{ backgroundColor: '#1a1a2e' }} />
            {/* Main body */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(145deg, #2a2a40 0%, #1e1e32 100%)',
                boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.03)',
              }}
            />
            {/* Lock icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" fill="#3a3a55" />
                <path
                  d="M8 11V7a4 4 0 0 1 8 0v4"
                  stroke="#3a3a55"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </>
        )}
      </button>

      {/* Stars display — gold with glow */}
      {isCompleted && (
        <div className="flex gap-1">
          {[1, 2, 3].map(s => (
            <span
              key={s}
              className="text-base"
              style={{
                color: s <= stars ? '#ffd700' : '#2a2a40',
                textShadow: s <= stars ? '0 0 10px rgba(255,215,0,0.6), 0 1px 2px rgba(0,0,0,0.3)' : 'none',
                filter: s <= stars ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' : 'none',
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* Song title */}
      <p className={`text-xs max-w-[110px] text-center leading-tight ${
        isCurrentLevel
          ? 'text-gray-200 font-semibold'
          : isCompleted
            ? 'text-gray-400'
            : isUnlocked
              ? 'text-gray-500'
              : 'text-gray-700'
      }`}>
        {level.title}
      </p>
    </div>
  );
}
