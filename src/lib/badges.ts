import { UserProfile } from '@/types/game';
import { BADGES } from '@/data/badges';
import { ALL_TRACKS } from '@/data/tracks';

/**
 * Check which badges the user has newly earned.
 * Returns an array of badge IDs that are newly unlocked.
 */
export function checkNewBadges(profile: UserProfile): string[] {
  const earned = new Set(profile.earnedBadges.map(b => b.badgeId));
  const newBadges: string[] = [];

  for (const badge of BADGES) {
    if (earned.has(badge.id)) continue;
    if (isBadgeEarned(badge.id, profile)) {
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

function isBadgeEarned(badgeId: string, profile: UserProfile): boolean {
  const sp = profile.songProgress;
  const completedSongs = Object.values(sp).filter(s => s.timesCompleted > 0);
  const sRankSongs = Object.values(sp).filter(s => s.bestGrade === 'S');
  const threeStarSongs = Object.values(sp).filter(s => s.stars >= 3);

  switch (badgeId) {
    // Milestones
    case 'first-song':
      return completedSongs.length >= 1;
    case 'five-songs':
      return completedSongs.length >= 5;
    case 'ten-songs':
      return completedSongs.length >= 10;
    case 'twenty-songs':
      return completedSongs.length >= 20;

    // Skill
    case 'perfect-song':
      return Object.values(sp).some(s => s.bestAccuracy >= 100);
    case 'first-s-rank':
      return sRankSongs.length >= 1;
    case 'five-s-ranks':
      return sRankSongs.length >= 5;
    case 'combo-50':
      return Object.values(sp).some(s => s.bestCombo >= 50);
    case 'combo-100':
      return Object.values(sp).some(s => s.bestCombo >= 100);
    case 'three-stars-five':
      return threeStarSongs.length >= 5;

    // Dedication
    case 'streak-3':
      return profile.longestStreak >= 3;
    case 'streak-7':
      return profile.longestStreak >= 7;
    case 'streak-30':
      return profile.longestStreak >= 30;
    case 'level-5':
      return profile.level >= 5;
    case 'level-10':
      return profile.level >= 10;

    // Track completion
    case 'suzuki-book1': {
      const track = ALL_TRACKS.find(t => t.id === 'suzuki');
      if (!track) return false;
      return track.levels.every(l => {
        const s = sp[l.songId];
        return s && s.stars > 0;
      });
    }
    case 'popular-complete': {
      const track = ALL_TRACKS.find(t => t.id === 'popular');
      if (!track) return false;
      return track.levels.every(l => {
        const s = sp[l.songId];
        return s && s.stars > 0;
      });
    }
    case 'classics-complete': {
      const track = ALL_TRACKS.find(t => t.id === 'classics');
      if (!track) return false;
      return track.levels.every(l => {
        const s = sp[l.songId];
        return s && s.stars > 0;
      });
    }
    case 'first-bach': {
      // Bach songs in suzuki track: musette, minuet-1, minuet-2, minuet-3
      const bachSongIds = ['suzuki-musette', 'suzuki-minuet-1', 'suzuki-minuet-2', 'suzuki-minuet-3'];
      return bachSongIds.some(id => {
        const s = sp[id];
        return s && s.timesCompleted > 0;
      });
    }

    default:
      return false;
  }
}
