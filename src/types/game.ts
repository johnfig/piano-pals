// MIDI note number (21 = A0, 60 = C4, 108 = C8)
export type MidiNote = number;

export type HitRating = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export type GameState =
  | 'PROFILE_SETUP'
  | 'TRACK_SELECT'
  | 'TRACK_MAP'
  | 'MENU'
  | 'SPEED_SELECT'
  | 'WARMUP'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'PAUSED'
  | 'RESULTS'
  | 'FREE_PIANO';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

// A song declares the range of notes it uses, determining lane count
export interface NoteRange {
  lowest: MidiNote;       // e.g., 60 for C4
  highest: MidiNote;      // e.g., 72 for C5
  whiteKeysOnly: boolean; // true = skip sharps/flats in lane layout
}

export interface SongNote {
  time: number;       // seconds from song start when note should be hit
  note: MidiNote;     // MIDI note number
  duration: number;   // seconds the note is held
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  difficulty: Difficulty;
  bpm: number;
  notes: SongNote[];
  noteRange: NoteRange;
  // Authentic piano version (with sharps/flats, correct key signature)
  // Used when a MIDI keyboard is connected; falls back to notes/noteRange otherwise
  pianoNotes?: SongNote[];
  pianoNoteRange?: NoteRange;
  // Track metadata (optional, set when part of a track)
  trackId?: string;
  trackLevel?: number;
}

export interface ActiveNote {
  id: number;
  songNote: SongNote;
  lane: number;          // computed from song's NoteRange
  y: number;             // current y position (0 = top, 1 = hit zone)
  height: number;        // visual height based on duration
  hit: boolean;
  hitRating?: HitRating;
  missed: boolean;
  opacity: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface HitEffect {
  x: number;
  y: number;
  time: number;
  rating: HitRating;
  lane: number;
}

export interface GameStats {
  perfect: number;
  great: number;
  good: number;
  miss: number;
  maxCombo: number;
  score: number;
  totalNotes: number;
}

export interface HighScore {
  songId: string;
  score: number;
  grade: Grade;
  maxCombo: number;
  date: string;
}

// --- User Profile & Persistence ---

export interface UserProfile {
  id: string;
  displayName: string;
  avatarIndex: number;
  createdAt: string;

  // Progression
  xp: number;
  level: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastPlayDate: string | null; // ISO date string (date only: YYYY-MM-DD)

  // Per-song progress
  songProgress: Record<string, SongProgress>;

  // Badges
  earnedBadges: EarnedBadge[];

  // Per-track progress
  trackProgress: Record<string, TrackProgress>;
}

export interface SongProgress {
  songId: string;
  bestScore: number;
  bestGrade: Grade;
  bestAccuracy: number;
  bestCombo: number;
  timesPlayed: number;
  timesCompleted: number; // grade D or better
  firstPlayedAt: string;
  lastPlayedAt: string;
  stars: number; // 0-3 based on grade
}

export interface TrackProgress {
  trackId: string;
  currentLevel: number;       // highest unlocked level
  completedLevels: number[];  // level numbers that have been completed
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
}
