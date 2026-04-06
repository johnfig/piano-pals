import { sql } from '@vercel/postgres';
import { UserProfile, SongProgress, EarnedBadge, TrackProgress, Grade } from '@/types/game';

// --- Schema Initialization ---

export async function initDatabase(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id             TEXT PRIMARY KEY,
      display_name   TEXT NOT NULL,
      avatar_index   INTEGER NOT NULL,
      created_at     TEXT NOT NULL,
      xp             INTEGER NOT NULL DEFAULT 0,
      level          INTEGER NOT NULL DEFAULT 1,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_play_date TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS song_progress (
      profile_id      TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      song_id         TEXT NOT NULL,
      best_score      INTEGER NOT NULL DEFAULT 0,
      best_grade      TEXT NOT NULL DEFAULT 'F',
      best_accuracy   REAL NOT NULL DEFAULT 0,
      best_combo      INTEGER NOT NULL DEFAULT 0,
      times_played    INTEGER NOT NULL DEFAULT 0,
      times_completed INTEGER NOT NULL DEFAULT 0,
      first_played_at TEXT NOT NULL,
      last_played_at  TEXT NOT NULL,
      stars           INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (profile_id, song_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS earned_badges (
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      badge_id   TEXT NOT NULL,
      earned_at  TEXT NOT NULL,
      PRIMARY KEY (profile_id, badge_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS track_progress (
      profile_id       TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      track_id         TEXT NOT NULL,
      current_level    INTEGER NOT NULL DEFAULT 1,
      completed_levels TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (profile_id, track_id)
    )
  `;
}

// Lazy init flag
let dbInitialized = false;

export async function ensureDb(): Promise<void> {
  if (dbInitialized) return;
  await initDatabase();
  dbInitialized = true;
}

// --- Query Helpers ---

export async function getAllProfiles(): Promise<UserProfile[]> {
  await ensureDb();
  const { rows } = await sql`SELECT * FROM profiles ORDER BY created_at ASC`;
  const profiles: UserProfile[] = [];
  for (const row of rows) {
    profiles.push(await hydrateProfile(row));
  }
  return profiles;
}

export async function getProfile(id: string): Promise<UserProfile | null> {
  await ensureDb();
  const { rows } = await sql`SELECT * FROM profiles WHERE id = ${id}`;
  if (rows.length === 0) return null;
  return hydrateProfile(rows[0]);
}

export async function upsertProfile(profile: UserProfile): Promise<void> {
  await ensureDb();

  // Upsert the profile row
  await sql`
    INSERT INTO profiles (id, display_name, avatar_index, created_at, xp, level, current_streak, longest_streak, last_play_date)
    VALUES (${profile.id}, ${profile.displayName}, ${profile.avatarIndex}, ${profile.createdAt}, ${profile.xp}, ${profile.level}, ${profile.currentStreak}, ${profile.longestStreak}, ${profile.lastPlayDate})
    ON CONFLICT (id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      avatar_index = EXCLUDED.avatar_index,
      xp = EXCLUDED.xp,
      level = EXCLUDED.level,
      current_streak = EXCLUDED.current_streak,
      longest_streak = EXCLUDED.longest_streak,
      last_play_date = EXCLUDED.last_play_date
  `;

  // Sync song progress - delete and re-insert for simplicity
  await sql`DELETE FROM song_progress WHERE profile_id = ${profile.id}`;
  for (const [songId, sp] of Object.entries(profile.songProgress)) {
    await sql`
      INSERT INTO song_progress (profile_id, song_id, best_score, best_grade, best_accuracy, best_combo, times_played, times_completed, first_played_at, last_played_at, stars)
      VALUES (${profile.id}, ${songId}, ${sp.bestScore}, ${sp.bestGrade}, ${sp.bestAccuracy}, ${sp.bestCombo}, ${sp.timesPlayed}, ${sp.timesCompleted}, ${sp.firstPlayedAt}, ${sp.lastPlayedAt}, ${sp.stars})
    `;
  }

  // Sync badges
  await sql`DELETE FROM earned_badges WHERE profile_id = ${profile.id}`;
  for (const badge of profile.earnedBadges) {
    await sql`
      INSERT INTO earned_badges (profile_id, badge_id, earned_at)
      VALUES (${profile.id}, ${badge.badgeId}, ${badge.earnedAt})
    `;
  }

  // Sync track progress
  await sql`DELETE FROM track_progress WHERE profile_id = ${profile.id}`;
  for (const [trackId, tp] of Object.entries(profile.trackProgress)) {
    await sql`
      INSERT INTO track_progress (profile_id, track_id, current_level, completed_levels)
      VALUES (${profile.id}, ${trackId}, ${tp.currentLevel}, ${JSON.stringify(tp.completedLevels)})
    `;
  }
}

export async function deleteProfileFromDb(id: string): Promise<void> {
  await ensureDb();
  await sql`DELETE FROM profiles WHERE id = ${id}`;
}

// --- Hydration: reconstruct UserProfile from DB rows ---

async function hydrateProfile(row: Record<string, unknown>): Promise<UserProfile> {
  const id = row.id as string;

  // Fetch related data
  const { rows: songRows } = await sql`SELECT * FROM song_progress WHERE profile_id = ${id}`;
  const { rows: badgeRows } = await sql`SELECT * FROM earned_badges WHERE profile_id = ${id}`;
  const { rows: trackRows } = await sql`SELECT * FROM track_progress WHERE profile_id = ${id}`;

  const songProgress: Record<string, SongProgress> = {};
  for (const sr of songRows) {
    songProgress[sr.song_id as string] = {
      songId: sr.song_id as string,
      bestScore: sr.best_score as number,
      bestGrade: sr.best_grade as Grade,
      bestAccuracy: sr.best_accuracy as number,
      bestCombo: sr.best_combo as number,
      timesPlayed: sr.times_played as number,
      timesCompleted: sr.times_completed as number,
      firstPlayedAt: sr.first_played_at as string,
      lastPlayedAt: sr.last_played_at as string,
      stars: sr.stars as number,
    };
  }

  const earnedBadges: EarnedBadge[] = badgeRows.map(br => ({
    badgeId: br.badge_id as string,
    earnedAt: br.earned_at as string,
  }));

  const trackProgress: Record<string, TrackProgress> = {};
  for (const tr of trackRows) {
    trackProgress[tr.track_id as string] = {
      trackId: tr.track_id as string,
      currentLevel: tr.current_level as number,
      completedLevels: JSON.parse(tr.completed_levels as string),
    };
  }

  return {
    id,
    displayName: row.display_name as string,
    avatarIndex: row.avatar_index as number,
    createdAt: row.created_at as string,
    xp: row.xp as number,
    level: row.level as number,
    currentStreak: row.current_streak as number,
    longestStreak: row.longest_streak as number,
    lastPlayDate: (row.last_play_date as string) || null,
    songProgress,
    earnedBadges,
    trackProgress,
  };
}
