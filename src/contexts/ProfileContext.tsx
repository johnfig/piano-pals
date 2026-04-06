'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, GameStats, Grade, Difficulty, EarnedBadge } from '@/types/game';
import {
  loadAllProfiles,
  loadActiveProfile,
  saveProfile,
  createProfileInDb,
  setActiveProfileId,
  getLegacyProfiles,
  clearLegacyData,
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
  createNewProfile: (name: string, avatarIndex: number) => void;
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

  // Load profiles on mount (async)
  useEffect(() => {
    async function init() {
      try {
        // Check for legacy localStorage data and migrate if needed
        const legacyProfiles = getLegacyProfiles();

        let profiles = await loadAllProfiles();

        if (legacyProfiles && legacyProfiles.length > 0 && profiles.length === 0) {
          // Migrate legacy data to database
          console.log('Migrating', legacyProfiles.length, 'profiles from localStorage to database...');
          for (const lp of legacyProfiles) {
            await saveProfile(lp);
          }
          clearLegacyData();
          profiles = await loadAllProfiles();
          console.log('Migration complete.');
        }

        const active = await loadActiveProfile();
        setAllProfiles(profiles);
        setProfile(active);
      } catch (error) {
        console.error('Failed to initialize profiles:', error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const isNewUser = !isLoading && allProfiles.length === 0;

  const createNewProfile = useCallback((name: string, avatarIndex: number) => {
    // Optimistic: create profile object immediately
    const tempProfile: UserProfile = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      displayName: name,
      avatarIndex,
      createdAt: new Date().toISOString(),
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayDate: null,
      songProgress: {},
      earnedBadges: [],
      trackProgress: {},
    };

    setProfile(tempProfile);
    setAllProfiles(prev => [...prev, tempProfile]);
    setActiveProfileId(tempProfile.id);

    // Persist to DB in background
    createProfileInDb(name, avatarIndex).then(dbProfile => {
      // If IDs differ (they shouldn't since we generate the same way),
      // update. In practice they'll match.
      if (dbProfile.id !== tempProfile.id) {
        setProfile(dbProfile);
        setAllProfiles(prev => prev.map(p => p.id === tempProfile.id ? dbProfile : p));
        setActiveProfileId(dbProfile.id);
      }
    }).catch(console.error);
  }, []);

  const switchProfile = useCallback((id: string) => {
    setActiveProfileId(id);
    // Find in current list first (instant)
    const found = allProfiles.find(p => p.id === id);
    if (found) {
      setProfile(found);
    }
    // Also fetch fresh from DB
    loadActiveProfile().then(fresh => {
      if (fresh) {
        setProfile(fresh);
        setAllProfiles(prev => prev.map(p => p.id === fresh.id ? fresh : p));
      }
    }).catch(console.error);
  }, [allProfiles]);

  const updateProfileInternal = useCallback((updater: (prev: UserProfile) => UserProfile) => {
    setProfile(prev => {
      if (!prev) return prev;
      const updated = updater(prev);
      // Save to DB in background
      saveProfile(updated).catch(console.error);
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

    // Optimistic update — set state immediately
    setProfile(updated);
    setAllProfiles(profiles => profiles.map(p => p.id === updated.id ? updated : p));

    // Persist to DB in background
    saveProfile(updated).catch(console.error);

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
