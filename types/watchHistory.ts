// Watch history item type
export interface WatchHistoryItem {
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  currentTime: number;
  duration: number;
  lastWatched: Date;
  seasonNumber?: number;
  episodeNumber?: number;
}
