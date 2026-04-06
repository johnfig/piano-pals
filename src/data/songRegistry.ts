import { Song } from '@/types/game';

// Import all songs from all directories
import { songs as classicSongs } from '@/songs';
import { popularSongs } from '@/songs/popular';

// Build flat lookup by song ID
const registry: Record<string, Song> = {};

// Suzuki songs will be added dynamically when available
let suzukiSongsLoaded = false;
let suzukiSongs: Song[] = [];

try {
  // Dynamic import of suzuki songs
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const suzukiModule = require('@/songs/suzuki');
  suzukiSongs = suzukiModule.suzukiBook1Songs || suzukiModule.suzukiSongs || [];
  suzukiSongsLoaded = true;
} catch {
  // Suzuki songs not yet available
}

// Register all songs
for (const song of [...classicSongs, ...popularSongs, ...suzukiSongs]) {
  registry[song.id] = song;
}

export function getSong(id: string): Song | undefined {
  return registry[id];
}

export function getAllSongs(): Song[] {
  return Object.values(registry);
}

export { suzukiSongsLoaded };
export default registry;
