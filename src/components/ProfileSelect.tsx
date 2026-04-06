'use client';

import { useState } from 'react';
import { UserProfile } from '@/types/game';
import { xpToNextLevel } from '@/lib/storage';
import { AVATARS } from '@/constants/avatars';

interface ProfileSelectProps {
  profiles: UserProfile[];
  onSelectProfile: (id: string) => void;
  onCreateNew: () => void;
  onDeleteProfile: (id: string) => void;
  onChangeAvatar: (id: string, avatarIndex: number) => void;
}

export default function ProfileSelect({ profiles, onSelectProfile, onCreateNew, onDeleteProfile, onChangeAvatar }: ProfileSelectProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0F0B1A] z-50 p-4">
      {/* Title */}
      <div className="mb-10 text-center">
        <h1 className="text-6xl font-black tracking-tight mb-2">
          <span className="text-[#FF6B6B]">
            Piano
          </span>
          <span className="text-white ml-3">Pals</span>
        </h1>
        <p className="text-gray-400 text-lg mt-2">Who&apos;s playing?</p>
      </div>

      {/* Profile cards */}
      <div className="w-full max-w-md space-y-3">
        {profiles.map((profile) => {
          const { current, needed } = xpToNextLevel(profile);
          const progressPct = needed > 0 ? (current / needed) * 100 : 100;
          const avatar = AVATARS[profile.avatarIndex] ?? '🎹';
          const isEditing = editingId === profile.id;
          const isConfirmingDelete = confirmDeleteId === profile.id;

          return (
            <div key={profile.id} className="relative">
              {/* Main profile card */}
              <div
                className={`w-full group relative overflow-hidden rounded-xl border bg-white/5 px-5 py-4 text-left transition-all ${
                  isEditing ? 'border-[#FF6B6B]/50' : 'border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar - clickable to select */}
                  <button
                    onClick={() => !isEditing && onSelectProfile(profile.id)}
                    className="w-12 h-12 rounded-full bg-[#FF6B6B]/15 flex items-center justify-center text-2xl flex-shrink-0 hover:scale-110 transition-transform"
                  >
                    {avatar}
                  </button>

                  {/* Info - clickable to select */}
                  <button
                    onClick={() => !isEditing && onSelectProfile(profile.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-lg truncate">
                        {profile.displayName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FF6B6B]/15 text-[#FF6B6B] flex-shrink-0">
                        Lv.{profile.level}
                      </span>
                    </div>

                    {/* XP bar */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#FF6B6B]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-gray-500 text-xs flex-shrink-0">{profile.xp} XP</span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      {profile.currentStreak > 0 && (
                        <span className="text-orange-400">🔥 {profile.currentStreak} day streak</span>
                      )}
                      <span>{Object.keys(profile.songProgress).length} songs played</span>
                    </div>
                  </button>

                  {/* Edit/Delete actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(isEditing ? null : profile.id);
                        setConfirmDeleteId(null);
                      }}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors text-sm"
                      title="Edit avatar"
                    >
                      {isEditing ? '×' : '✏️'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isConfirmingDelete) {
                          onDeleteProfile(profile.id);
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(profile.id);
                          setTimeout(() => setConfirmDeleteId(null), 3000);
                        }
                      }}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors text-sm ${
                        isConfirmingDelete
                          ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title={isConfirmingDelete ? 'Click again to confirm' : 'Delete profile'}
                    >
                      {isConfirmingDelete ? '!' : '🗑'}
                    </button>
                  </div>
                </div>

                {/* Confirm delete message */}
                {isConfirmingDelete && (
                  <div className="mt-2 text-xs text-red-400 text-center animate-pulse">
                    Click again to permanently delete this profile
                  </div>
                )}

                {/* Hover gradient */}
                {!isEditing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B]/0 via-[#FF6B6B]/5 to-[#FF6B6B]/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}
              </div>

              {/* Avatar picker dropdown */}
              {isEditing && (
                <div className="mt-2 p-4 rounded-xl bg-white/5 border border-[#FF6B6B]/30">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    Change Avatar
                  </p>
                  <div className="grid grid-cols-7 gap-2">
                    {AVATARS.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onChangeAvatar(profile.id, i);
                          setEditingId(null);
                        }}
                        className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                          profile.avatarIndex === i
                            ? 'bg-[#FF6B6B]/20 border-2 border-[#FF6B6B] scale-110'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-110'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add new profile */}
        <button
          onClick={onCreateNew}
          className="w-full rounded-xl border-2 border-dashed border-white/15 px-5 py-4 text-center text-gray-500 hover:text-white hover:border-white/30 transition-colors"
        >
          <span className="text-2xl mr-2">+</span>
          Add Player
        </button>
      </div>
    </div>
  );
}
