'use client';

import { useState, useEffect } from 'react';
import { GameStats, Grade, Song, UserProfile } from '@/types/game';
import { gradeToStars, xpToNextLevel } from '@/lib/storage';
import { getBadge } from '@/data/badges';

interface ResultsScreenProps {
  song: Song;
  stats: GameStats;
  grade: Grade;
  xpEarned: number;
  leveledUp: boolean;
  isFirstClear: boolean;
  newBadges: string[];
  profile: UserProfile | null;
  onReplay: () => void;
  onMenu: () => void;
  onNextLevel?: () => void;
}

const gradeColors: Record<Grade, string> = {
  S: 'from-yellow-300 to-yellow-500',
  A: 'from-green-300 to-green-500',
  B: 'from-blue-300 to-blue-500',
  C: 'from-purple-300 to-purple-500',
  D: 'from-orange-300 to-orange-500',
  F: 'from-red-400 to-red-600',
};

const gradeGlow: Record<Grade, string> = {
  S: '0 0 60px rgba(255,215,0,0.5)',
  A: '0 0 40px rgba(34,197,94,0.4)',
  B: '0 0 40px rgba(59,130,246,0.4)',
  C: '0 0 30px rgba(168,85,247,0.3)',
  D: '0 0 30px rgba(249,115,22,0.3)',
  F: '0 0 30px rgba(239,68,68,0.3)',
};

export default function ResultsScreen({
  song,
  stats,
  grade,
  xpEarned,
  leveledUp,
  isFirstClear,
  newBadges,
  profile,
  onReplay,
  onMenu,
  onNextLevel,
}: ResultsScreenProps) {
  const accuracy = stats.totalNotes > 0
    ? ((stats.perfect + stats.great + stats.good) / stats.totalNotes * 100).toFixed(1)
    : '0';

  const stars = gradeToStars(grade);
  const [animatedStars, setAnimatedStars] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  // Animate stars appearing, then XP, then level up, then badges
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    if (stars > 0) {
      for (let i = 1; i <= stars; i++) {
        timers.push(setTimeout(() => setAnimatedStars(i), i * 300));
      }
    }
    const xpDelay = stars > 0 ? stars * 300 + 400 : 400;
    timers.push(setTimeout(() => setShowXP(true), xpDelay));
    if (leveledUp) {
      timers.push(setTimeout(() => setShowLevelUp(true), xpDelay + 400));
    }
    if (newBadges.length > 0) {
      const badgeDelay = xpDelay + (leveledUp ? 800 : 400);
      timers.push(setTimeout(() => setShowBadges(true), badgeDelay));
    }
    return () => timers.forEach(clearTimeout);
  }, [stars, leveledUp, newBadges.length]);

  const xpProgress = profile ? xpToNextLevel(profile) : null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a1a] z-50 overflow-y-auto py-8">
      <div className="text-center space-y-5 max-w-md w-full px-4">
        {/* Song info */}
        <div>
          <p className="text-gray-500 text-sm uppercase tracking-wider">Results</p>
          <h2 className="text-2xl font-bold text-white mt-1">{song.title}</h2>
        </div>

        {/* Grade */}
        <div
          className="inline-block"
          style={{ filter: `drop-shadow(${gradeGlow[grade]})` }}
        >
          <span
            className={`text-9xl font-black bg-gradient-to-b ${gradeColors[grade]} bg-clip-text text-transparent`}
          >
            {grade}
          </span>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3].map(s => (
            <span
              key={s}
              className={`text-4xl transition-all duration-300 ${
                s <= animatedStars
                  ? 'text-yellow-400 scale-100 opacity-100'
                  : 'text-gray-700 scale-75 opacity-40'
              }`}
              style={{
                textShadow: s <= animatedStars ? '0 0 20px rgba(255,215,0,0.6)' : 'none',
              }}
            >
              ★
            </span>
          ))}
        </div>

        {/* Score */}
        <div>
          <p className="text-5xl font-black text-white tabular-nums">
            {stats.score.toLocaleString()}
          </p>
          <p className="text-gray-500 text-sm mt-1">{accuracy}% accuracy</p>
        </div>

        {/* XP Earned */}
        {showXP && xpEarned > 0 && (
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-purple-400 font-bold text-lg">+{xpEarned} XP</span>
              {isFirstClear && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400">
                  First Clear!
                </span>
              )}
            </div>
            {/* XP bar */}
            {xpProgress && (
              <div className="mt-2 flex items-center gap-2 max-w-xs mx-auto">
                <span className="text-gray-600 text-xs">Lv.{profile?.level}</span>
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                    style={{ width: `${xpProgress.needed > 0 ? (xpProgress.current / xpProgress.needed) * 100 : 100}%` }}
                  />
                </div>
                <span className="text-gray-600 text-xs">{xpProgress.current}/{xpProgress.needed}</span>
              </div>
            )}
          </div>
        )}

        {/* Level up */}
        {showLevelUp && (
          <div className="animate-bounce-in">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <span className="text-3xl">🎉</span>
              <span className="text-yellow-300 font-black text-xl">Level Up!</span>
              <span className="text-yellow-400 font-bold">Lv.{profile?.level}</span>
            </div>
          </div>
        )}

        {/* Badges earned */}
        {showBadges && newBadges.length > 0 && (
          <div className="animate-fade-in space-y-2">
            {newBadges.map(badgeId => {
              const badge = getBadge(badgeId);
              if (!badge) return null;
              return (
                <div
                  key={badgeId}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-bounce-in"
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <div className="text-left">
                    <p className="text-amber-300 font-bold text-sm">Badge Earned!</p>
                    <p className="text-white font-semibold">{badge.name}</p>
                    <p className="text-gray-400 text-xs">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Perfect" value={stats.perfect} color="text-yellow-400" />
          <StatBox label="Great" value={stats.great} color="text-green-400" />
          <StatBox label="Good" value={stats.good} color="text-blue-400" />
          <StatBox label="Miss" value={stats.miss} color="text-red-400" />
        </div>

        {/* Max combo */}
        <div className="py-3 px-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Max Combo</p>
          <p className="text-2xl font-black text-white">{stats.maxCombo}</p>
        </div>

        {/* Streak */}
        {profile && profile.currentStreak > 0 && (
          <div className="text-orange-400 text-sm font-semibold">
            🔥 {profile.currentStreak} day streak!
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center pt-2">
          {onNextLevel && grade !== 'F' && (
            <button
              onClick={onNextLevel}
              className="py-3 px-8 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg hover:scale-105 active:scale-95 transition-transform"
            >
              Next Level →
            </button>
          )}
          <button
            onClick={onReplay}
            className={`py-3 px-8 rounded-xl text-white font-bold text-lg hover:scale-105 active:scale-95 transition-transform ${
              onNextLevel && grade !== 'F'
                ? 'border border-white/20 bg-white/5'
                : 'bg-gradient-to-r from-pink-500 to-purple-500'
            }`}
          >
            Play Again
          </button>
          <button
            onClick={onMenu}
            className="py-3 px-6 rounded-xl border border-white/20 text-gray-400 font-semibold hover:text-white hover:border-white/40 transition-colors"
          >
            {onNextLevel ? 'Map' : 'Menu'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="py-3 px-4 rounded-xl bg-white/5 border border-white/10">
      <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}
