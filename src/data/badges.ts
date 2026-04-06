export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'skill' | 'dedication' | 'track';
}

export const BADGES: BadgeDefinition[] = [
  // Milestones
  { id: 'first-song', name: 'First Notes', description: 'Complete your first song', icon: '🎵', category: 'milestone' },
  { id: 'five-songs', name: 'Getting Started', description: 'Complete 5 different songs', icon: '🎶', category: 'milestone' },
  { id: 'ten-songs', name: 'Rising Star', description: 'Complete 10 different songs', icon: '🌟', category: 'milestone' },
  { id: 'twenty-songs', name: 'Virtuoso', description: 'Complete 20 different songs', icon: '👑', category: 'milestone' },

  // Skill
  { id: 'perfect-song', name: 'Perfectionist', description: 'Get 100% accuracy on any song', icon: '💎', category: 'skill' },
  { id: 'first-s-rank', name: 'S-Rank!', description: 'Earn an S rank on any song', icon: '⭐', category: 'skill' },
  { id: 'five-s-ranks', name: 'S-Rank Collector', description: 'Earn S rank on 5 different songs', icon: '🏅', category: 'skill' },
  { id: 'combo-50', name: 'Combo Builder', description: 'Reach a 50 note combo', icon: '🔥', category: 'skill' },
  { id: 'combo-100', name: 'Combo Master', description: 'Reach a 100 note combo', icon: '💥', category: 'skill' },
  { id: 'three-stars-five', name: 'Star Collector', description: 'Earn 3 stars on 5 different songs', icon: '✨', category: 'skill' },

  // Dedication
  { id: 'streak-3', name: 'On a Roll', description: 'Play 3 days in a row', icon: '📅', category: 'dedication' },
  { id: 'streak-7', name: 'Week Warrior', description: 'Play 7 days in a row', icon: '🗓️', category: 'dedication' },
  { id: 'streak-30', name: 'Dedicated Student', description: 'Play 30 days in a row', icon: '🏆', category: 'dedication' },
  { id: 'level-5', name: 'Leveling Up', description: 'Reach level 5', icon: '📈', category: 'dedication' },
  { id: 'level-10', name: 'Experienced', description: 'Reach level 10', icon: '🎓', category: 'dedication' },

  // Track completion
  { id: 'suzuki-book1', name: 'Suzuki Graduate', description: 'Complete all Suzuki Book 1 songs', icon: '🎹', category: 'track' },
  { id: 'popular-complete', name: 'Pop Star', description: 'Complete all Popular songs', icon: '🎤', category: 'track' },
  { id: 'classics-complete', name: 'Classical Master', description: 'Complete all Classical songs', icon: '🎻', category: 'track' },
  { id: 'first-bach', name: 'Bach Beginner', description: 'Complete your first Bach piece', icon: '🎼', category: 'track' },
];

export const BADGE_MAP: Record<string, BadgeDefinition> = {};
for (const badge of BADGES) {
  BADGE_MAP[badge.id] = badge;
}

export function getBadge(id: string): BadgeDefinition | undefined {
  return BADGE_MAP[id];
}
