'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, GameStats, Grade, Difficulty, EarnedBadge } from '@/types/game';
import {
  loadAllProfiles,
  loadActiveProfile,
  saveProfile,
  createProfile,
  setActiveProfileId,
  updateSongProgress,
  updateStreak,
  addXP,
  gradeToStars,
} from '@/lib/storage';
import { calculateXPFromResult } from '@/lib/xp';
import { checkNewBadges } from '@/lib/badges';
import { ALL_TRACKS } from '@/data/tracks';

interface ProfileContextValue {
  profile: UserProfile | null;
  allProfiles: UserProfile[];
  isNewUser: boolean;
  isLoading: boolean;

  // Profile management
  createNewProfile: (name: string, avatarIndex: number) => UserProfile;
  switchProfile: (id: string) => void;

  // Game results
  recordSongResult: (
    songId: string,
    stats: GameStats,
    grade: Grade,
    difficulty: Difficulty,
  ) => { xpEarned: number; leveledUp: boolean; isFirstClear: boolean; newBadges: string[] };

  // Manual profile updates
  updateProfile: (updater: (prev: UserProfile) => UserProfile) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load on mount
  useEffect(() => {
    const profiles = loadAllProfiles();
    const active = loadActiveProfile();
    setAllProfiles(profiles);
    setProfile(active);
    setIsLoading(false);
  }, []);

  const isNewUser = !isLoading && allProfiles.length === 0;

  const createNewProfile = useCallback((name: string, avatarIndex: number): UserProfile => {
    const newProfile = createProfile(name, avatarIndex);
    setProfile(newProfile);
    setAllProfiles(prev => [...prev, newProfile]);
    return newProfile;
  }, []);

  const switchProfile = useCallback((id: string) => {
    const profiles = loadAllProfiles();
    const target = profiles.find(p => p.id === id);
    if (target) {
      setActiveProfileId(id);
      setProfile(target);
      setAllProfiles(profiles);
    }
  }, []);

  const updateProfileInternal = useCallback((updater: (prev: UserProfile) => UserProfile) => {
    setProfile(prev => {
      if (!prev) return prev;
      const updated = updater(prev);
      saveProfile(updated);
      setAllProfiles(profiles => profiles.map(p => p.id === updated.id ? updated : p));
      return updated;
    });
  }, []);

  const recordSongResult = useCallback((
    songId: string,
    stats: GameStats,
    grade: Grade,
    difficulty: Difficulty,
  ) => {
    if (!profile) return { xpEarned: 0, leveledUp: false, isFirstClear: false, newBadges: [] };

    const isFirstClear = !profile.songProgress[songId]?.timesCompleted && grade !== 'F';
    const xpEarned = calculateXPFromResult(stats, grade, difficulty, isFirstClear);
    const oldLevel = profile.level;

    let updated = updateSongProgress(profile, songId, stats, grade);
    updated = updateStreak(updated);
    updated = addXP(updated, xpEarned);

    // Update track progress for any tracks containing this song
    const stars = gradeToStars(grade);
    for (const track of ALL_TRACKS) {
      const level = track.levels.find(l => l.songId === songId);
      if (!level) continue;

      const trackProg = updated.trackProgress[track.id] ?? {
        trackId: track.id,
        currentLevel: 1,
        completedLevels: [],
      };

      if (stars > 0 && !trackProg.completedLevels.includes(level.levelNumber)) {
        trackProg.completedLevels = [...trackProg.completedLevels, level.levelNumber];
      }

      // Update current level to the next uncompleted level
      const nextLevel = track.levels.find(l => !trackProg.completedLevels.includes(l.levelNumber));
      trackProg.currentLevel = nextLevel?.levelNumber ?? track.levels[track.levels.length - 1].levelNumber;

      updated = {
        ...updated,
        trackProgress: {
          ...updated.trackProgress,
          [track.id]: trackProg,
        },
      };
    }

    // Check for newly earned badges
    const newBadges = checkNewBadges(updated);
    if (newBadges.length > 0) {
      const now = new Date().toISOString();
      const newEarned: EarnedBadge[] = newBadges.map(id => ({ badgeId: id, earnedAt: now }));
      updated = {
        ...updated,
        earnedBadges: [...updated.earnedBadges, ...newEarned],
      };
    }

    const leveledUp = updated.level > oldLevel;

    saveProfile(updated);
    setProfile(updated);
    setAllProfiles(profiles => profiles.map(p => p.id === updated.id ? updated : p));

    return { xpEarned, leveledUp, isFirstClear, newBadges };
  }, [profile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        allProfiles,
        isNewUser,
        isLoading,
        createNewProfile,
        switchProfile,
        recordSongResult,
        updateProfile: updateProfileInternal,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return ctx;
}
