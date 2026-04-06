'use client';

import { UserProfile } from '@/types/game';
import { Track } from '@/types/tracks';
import { ALL_TRACKS } from '@/data/tracks';
import { BADGES } from '@/data/badges';
import { xpToNextLevel } from '@/lib/storage';
import InputManager from '@/engine/InputManager';
import MidiStatus from './MidiStatus';
import { AVATARS } from '@/constants/avatars';

interface TrackSelectProps {
  profile: UserProfile;
  inputManager: InputManager;
  onSelectTrack: (track: Track) => void;
  onFreePlay: () => void;
  onSwitchProfile: () => void;
}

export default function TrackSelect({ profile, inputManager, onSelectTrack, onFreePlay, onSwitchProfile }: TrackSelectProps) {
  const xpProgress = xpToNextLevel(profile);
  const avatar = AVATARS[profile.avatarIndex] ?? '🎹';
  const totalSongsPlayed = Object.values(profile.songProgress).filter(s => s.timesCompleted > 0).length;
  const totalStarsEarned = Object.values(profile.songProgress).reduce((sum, s) => sum + s.stars, 0);
  const xpPct = xpProgress.needed > 0 ? (xpProgress.current / xpProgress.needed) * 100 : 100;

  return (
    <div className="fixed inset-0 flex flex-col z-50 overflow-y-auto" style={{ backgroundColor: '#0F0B1A' }}>
      {/* Profile bar */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-4">
        <button
          onClick={onSwitchProfile}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1A1530] border border-white/[0.08] hover:bg-white/8 transition-all group"
        >
          {/* Avatar with level ring */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg viewBox="0 0 48 48" className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="21" fill="none"
                stroke="url(#xpGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${xpPct * 1.32} 132`}
              />
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FF6B6B" />
                  <stop offset="100%" stopColor="#FF6B6B" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-1 rounded-full bg-white/5 flex items-center justify-center text-xl">
              {avatar}
            </div>
          </div>

          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{profile.displayName}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/20">
                LV {profile.level}
              </span>
              {profile.currentStreak > 0 && (
                <span className="text-orange-400 text-xs font-semibold">🔥 {profile.currentStreak}</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[#A09BB8] text-[10px] font-medium">{xpProgress.current}/{xpProgress.needed} XP</span>
            </div>
          </div>
          <span className="text-[#635E78] text-xs group-hover:text-white/60 transition-colors">Switch ›</span>
        </button>
      </div>

      {/* Hero section */}
      <div className="text-center mt-8 mb-8">
        <h1 className="text-6xl font-black tracking-tight">
          <span style={{ color: '#FF6B6B' }}>
            Piano
          </span>
          <span className="text-white ml-3">Pals</span>
        </h1>

        {/* Stats bar */}
        <div className="flex justify-center gap-5 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🎵</span>
            <div>
              <p className="text-white font-bold text-sm">{totalSongsPlayed}</p>
              <p className="text-[#A09BB8] text-[10px] uppercase tracking-wider">Songs</p>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-lg" style={{ color: '#FFD700', textShadow: '0 0 8px rgba(255,215,0,0.4)' }}>★</span>
            <div>
              <p className="text-white font-bold text-sm">{totalStarsEarned}</p>
              <p className="text-[#A09BB8] text-[10px] uppercase tracking-wider">Stars</p>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🏅</span>
            <div>
              <p className="text-white font-bold text-sm">{profile.earnedBadges.length}</p>
              <p className="text-[#A09BB8] text-[10px] uppercase tracking-wider">Badges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Track cards */}
      <div className="w-full max-w-2xl mx-auto px-4 space-y-4">
        {ALL_TRACKS.map((track) => {
          const trackProgress = profile.trackProgress[track.id];
          const completedCount = trackProgress?.completedLevels.length ?? 0;
          const totalCount = track.levels.length;
          const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          let trackStars = 0;
          for (const level of track.levels) {
            const songProg = profile.songProgress[level.songId];
            if (songProg) trackStars += songProg.stars;
          }

          return (
            <button
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className="w-full group relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${track.color}15 0%, ${track.color}05 100%)`,
                border: `1px solid ${track.color}25`,
              }}
            >
              <div className="flex items-center gap-4">
                {/* Icon with glow */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 relative"
                  style={{
                    background: `linear-gradient(145deg, ${track.color}30, ${track.color}15)`,
                    boxShadow: `0 4px 15px ${track.color}20`,
                  }}
                >
                  {track.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg">{track.name}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{track.description}</p>

                  {/* Progress */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progressPct}%`,
                          background: `linear-gradient(90deg, ${track.color}, ${track.color}cc)`,
                          boxShadow: progressPct > 0 ? `0 0 8px ${track.color}40` : 'none',
                        }}
                      />
                    </div>
                    <span className="text-white/40 text-xs font-semibold">{completedCount}/{totalCount}</span>
                  </div>

                  {/* Stars */}
                  {trackStars > 0 && (
                    <div className="mt-1 flex items-center gap-1">
                      <span style={{ color: '#ffd700', fontSize: '11px' }}>★</span>
                      <span className="text-[11px] font-semibold" style={{ color: '#ffd700' }}>{trackStars}</span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <span className="text-white/20 text-xl group-hover:text-white/40 group-hover:translate-x-1 transition-all">›</span>
              </div>

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center, ${track.color}10, transparent 70%)`,
                }}
              />
            </button>
          );
        })}

        {/* Free Play */}
        <button
          onClick={onFreePlay}
          className="w-full group rounded-2xl border border-dashed border-[#FF6B6B]/20 p-5 text-center transition-all hover:bg-white/5 hover:border-[#FF6B6B]/40"
        >
          <span className="text-white/40 group-hover:text-white/70 font-semibold text-sm">
            🎵 Free Play — Pick any song
          </span>
        </button>
      </div>

      {/* Badges showcase */}
      {profile.earnedBadges.length > 0 && (
        <div className="w-full max-w-2xl mx-auto px-4 mt-8">
          <h3 className="text-[#635E78] text-[10px] font-bold uppercase tracking-widest mb-3">
            Badges ({profile.earnedBadges.length}/{BADGES.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.earnedBadges.map(eb => {
              const badge = BADGES.find(b => b.id === eb.badgeId);
              if (!badge) return null;
              return (
                <div
                  key={eb.badgeId}
                  className="group relative w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-lg hover:bg-white/10 hover:scale-110 transition-all cursor-default"
                  title={`${badge.name}: ${badge.description}`}
                >
                  {badge.icon}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <p className="text-white text-xs font-semibold">{badge.name}</p>
                    <p className="text-white/50 text-xs">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MidiStatus inputManager={inputManager} />
      <div className="h-8" />
    </div>
  );
}
