'use client';

import { useRef, useEffect } from 'react';
import { UserProfile, Song } from '@/types/game';
import { Track } from '@/types/tracks';
import { getSong } from '@/data/songRegistry';
import LevelNode from './LevelNode';

interface TrackMapProps {
  track: Track;
  profile: UserProfile;
  onSelectSong: (song: Song) => void;
  onBack: () => void;
}

// Snake pattern: center → right → center → left → ...
function getNodeOffset(index: number): number {
  const pattern = [0, 1, 0, -1];
  return pattern[index % 4];
}

export default function TrackMap({ track, profile, onSelectSong, onBack }: TrackMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLevelUnlocked = (levelNumber: number): boolean => {
    const level = track.levels.find(l => l.levelNumber === levelNumber);
    if (!level) return false;
    if (level.requiredStars === 0) return true;
    const prevLevel = track.levels.find(l => l.levelNumber === levelNumber - 1);
    if (!prevLevel) return true;
    const prevStars = profile.songProgress[prevLevel.songId]?.stars ?? 0;
    return prevStars >= level.requiredStars;
  };

  const currentLevelNumber = (() => {
    for (const level of track.levels) {
      const songProg = profile.songProgress[level.songId];
      if (!songProg || songProg.stars === 0) {
        if (isLevelUnlocked(level.levelNumber)) {
          return level.levelNumber;
        }
      }
    }
    return track.levels[track.levels.length - 1]?.levelNumber ?? 1;
  })();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const currentNode = el.querySelector(`[data-level="${currentLevelNumber}"]`);
    if (currentNode) {
      setTimeout(() => {
        currentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [currentLevelNumber]);

  const handleSelectLevel = (songId: string) => {
    const song = getSong(songId);
    if (song) onSelectSong(song);
  };

  const completedCount = track.levels.filter(l => {
    const sp = profile.songProgress[l.songId];
    return sp && sp.stars > 0;
  }).length;
  const totalStars = track.levels.reduce((sum, l) => sum + (profile.songProgress[l.songId]?.stars ?? 0), 0);
  const maxStars = track.levels.length * 3;
  const allComplete = completedCount === track.levels.length;

  const NODE_HEIGHT = 150;
  const OFFSET_PX = 80;

  return (
    <div className="fixed inset-0 flex flex-col z-50" style={{ backgroundColor: '#0F0B1A' }}>
      {/* Header with gradient accent */}
      <div
        className="flex-shrink-0 relative z-10"
        style={{
          background: `linear-gradient(135deg, ${track.color}20 0%, transparent 60%)`,
        }}
      >
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-[#1A1530] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors text-lg"
            >
              ←
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{track.icon}</span>
                <h2 className="text-white font-black text-xl tracking-tight">{track.name}</h2>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-white/50 text-xs font-medium">{completedCount}/{track.levels.length} levels</span>
                <span className="text-yellow-400 text-xs font-semibold">★ {totalStars}/{maxStars}</span>
              </div>
            </div>

            {/* Circular progress */}
            <div className="relative w-11 h-11">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={track.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(completedCount / track.levels.length) * 94.2} 94.2`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                {Math.round((completedCount / track.levels.length) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable map */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-16">
          <div className="relative">
            {/* SVG connecting paths */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 0, width: '100%', height: track.levels.length * NODE_HEIGHT }}
              viewBox={`0 0 400 ${track.levels.length * NODE_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {track.levels.map((level, index) => {
                if (index === 0) return null;
                const prevOffset = getNodeOffset(index - 1);
                const currOffset = getNodeOffset(index);

                const prevX = 200 + prevOffset * OFFSET_PX;
                const currX = 200 + currOffset * OFFSET_PX;
                const prevY = (index - 1) * NODE_HEIGHT + 50;
                const currY = index * NODE_HEIGHT + 50;
                const midY = (prevY + currY) / 2;

                const prevCompleted = (profile.songProgress[track.levels[index - 1].songId]?.stars ?? 0) > 0;

                return (
                  <g key={`path-${index}`}>
                    {/* Shadow path for depth */}
                    <path
                      d={`M ${prevX} ${prevY + 3} C ${prevX} ${midY + 3}, ${currX} ${midY + 3}, ${currX} ${currY + 3}`}
                      fill="none"
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth={prevCompleted ? 8 : 6}
                      strokeLinecap="round"
                    />
                    {/* Main path */}
                    <path
                      d={`M ${prevX} ${prevY} C ${prevX} ${midY}, ${currX} ${midY}, ${currX} ${currY}`}
                      fill="none"
                      stroke={prevCompleted ? track.color : 'rgba(255,255,255,0.06)'}
                      strokeOpacity={prevCompleted ? 0.5 : 1}
                      strokeWidth={prevCompleted ? 7 : 5}
                      strokeDasharray={prevCompleted ? 'none' : '12 12'}
                      strokeLinecap="round"
                    />
                    {/* Highlight on completed paths */}
                    {prevCompleted && (
                      <path
                        d={`M ${prevX} ${prevY - 1} C ${prevX} ${midY - 1}, ${currX} ${midY - 1}, ${currX} ${currY - 1}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth={3}
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Level nodes */}
            <div className="relative" style={{ zIndex: 1 }}>
              {track.levels.map((level, index) => {
                const unlocked = isLevelUnlocked(level.levelNumber);
                const isCurrent = level.levelNumber === currentLevelNumber;
                const songProg = profile.songProgress[level.songId];
                const offset = getNodeOffset(index);

                return (
                  <div
                    key={level.levelNumber}
                    data-level={level.levelNumber}
                    className="relative flex justify-center"
                    style={{
                      height: NODE_HEIGHT,
                      transform: `translateX(${offset * 20}%)`,
                    }}
                  >
                    {/* Mascot near current level */}
                    {isCurrent && (
                      <div
                        className="absolute z-10 text-4xl animate-bounce"
                        style={{
                          [offset <= 0 ? 'right' : 'left']: offset === 0 ? '25%' : '15%',
                          top: '20%',
                          animationDuration: '2s',
                        }}
                      >
                        🎵
                      </div>
                    )}

                    <LevelNode
                      level={level}
                      songProgress={songProg}
                      isUnlocked={unlocked}
                      isCurrentLevel={isCurrent}
                      trackColor={track.color}
                      onClick={() => unlocked && handleSelectLevel(level.songId)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track completion celebration */}
          {allComplete && (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-white font-black text-2xl">Track Complete!</p>
              <p className="text-white/50 text-sm mt-1">You&apos;ve mastered every song!</p>
              <div className="mt-4 flex justify-center gap-2">
                {[...Array(3)].map((_, i) => (
                  <span
                    key={i}
                    className="text-3xl"
                    style={{
                      color: '#ffd700',
                      textShadow: '0 0 15px rgba(255,215,0,0.6)',
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
