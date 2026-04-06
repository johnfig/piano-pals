import { UserProfile, SongProgress, GameStats, Grade } from '@/types/game';

const ACTIVE_PROFILE_KEY = 'piano-hero-active-profile';
const LEGACY_PROFILES_KEY = 'piano-hero-profiles';

// --- API-backed Profile CRUD ---

export async function loadAllProfiles(): Promise<UserProfile[]> {
  try {
    const res = await fetch('/api/profiles');
    if (!res.ok) throw new Error('Failed to fetch profiles');
    return await res.json();
  } catch (error) {
    console.error('loadAllProfiles error:', error);
    return [];
  }
}

export async function loadActiveProfile(): Promise<UserProfile | null> {
  const id = getActiveProfileId();
  if (!id) return null;
  try {
    const res = await fetch(`/api/profiles/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    await fetch(`/api/profiles/${profile.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
  } catch (error) {
    console.error('saveProfile error:', error);
  }
}

export async function createProfileInDb(displayName: string, avatarIndex: number): Promise<UserProfile> {
  const profile: UserProfile = {
    id: generateId(),
    displayName,
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

  try {
    await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
  } catch (error) {
    console.error('createProfileInDb error:', error);
  }

  setActiveProfileId(profile.id);
  return profile;
}

export async function deleteProfile(id: string): Promise<void> {
  try {
    await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('deleteProfile error:', error);
  }
  if (getActiveProfileId() === id) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }
}

// --- Active Profile ID (stays in localStorage — per-device preference) ---

export function getActiveProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

// --- Legacy localStorage Migration ---

export function getLegacyProfiles(): UserProfile[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LEGACY_PROFILES_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearLegacyData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LEGACY_PROFILES_KEY);
}

// --- Pure Computation Functions (unchanged) ---

export function gradeToStars(grade: Grade): number {
  switch (grade) {
    case 'S':
    case 'A':
      return 3;
    case 'B':
      return 2;
    case 'C':
    case 'D':
      return 1;
    case 'F':
    default:
      return 0;
  }
}

export function updateSongProgress(
  profile: UserProfile,
  songId: string,
  stats: GameStats,
  grade: Grade,
): UserProfile {
  const now = new Date().toISOString();
  const accuracy = stats.totalNotes > 0
    ? (stats.perfect + stats.great + stats.good) / stats.totalNotes * 100
    : 0;
  const stars = gradeToStars(grade);
  const isCompleted = grade !== 'F';

  const existing = profile.songProgress[songId];

  const progress: SongProgress = existing
    ? {
        ...existing,
        bestScore: Math.max(existing.bestScore, stats.score),
        bestGrade: comparableGrade(grade) > comparableGrade(existing.bestGrade) ? grade : existing.bestGrade,
        bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
        bestCombo: Math.max(existing.bestCombo, stats.maxCombo),
        timesPlayed: existing.timesPlayed + 1,
        timesCompleted: existing.timesCompleted + (isCompleted ? 1 : 0),
        lastPlayedAt: now,
        stars: Math.max(existing.stars, stars),
      }
    : {
        songId,
        bestScore: stats.score,
        bestGrade: grade,
        bestAccuracy: accuracy,
        bestCombo: stats.maxCombo,
        timesPlayed: 1,
        timesCompleted: isCompleted ? 1 : 0,
        firstPlayedAt: now,
        lastPlayedAt: now,
        stars,
      };

  return {
    ...profile,
    songProgress: {
      ...profile.songProgress,
      [songId]: progress,
    },
  };
}

export function updateStreak(profile: UserProfile): UserProfile {
  const today = getTodayDate();
  const lastPlay = profile.lastPlayDate;

  if (lastPlay === today) {
    return profile;
  }

  const yesterday = getYesterdayDate();

  let newStreak: number;
  if (lastPlay === yesterday) {
    newStreak = profile.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  return {
    ...profile,
    currentStreak: newStreak,
    longestStreak: Math.max(profile.longestStreak, newStreak),
    lastPlayDate: today,
  };
}

export function addXP(profile: UserProfile, amount: number): UserProfile {
  const newXP = profile.xp + amount;
  const newLevel = getLevelFromXP(newXP);

  return {
    ...profile,
    xp: newXP,
    level: newLevel,
  };
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(Math.pow(level - 1, 1.5) * 100);
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) {
    level++;
  }
  return level;
}

export function xpToNextLevel(profile: UserProfile): { current: number; needed: number } {
  const currentLevelXP = xpForLevel(profile.level);
  const nextLevelXP = xpForLevel(profile.level + 1);
  return {
    current: profile.xp - currentLevelXP,
    needed: nextLevelXP - currentLevelXP,
  };
}

// --- Utilities ---

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function comparableGrade(grade: Grade): number {
  const order: Record<Grade, number> = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
  return order[grade] ?? 0;
}
