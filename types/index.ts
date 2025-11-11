// Common types used across the application

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
  episode_run_time?: number[];
  adult?: boolean;
  genres?: Genre[];
  season_number?: number;
  episode_number?: number;
  subtitles?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string | null;
}

export interface CrewMember {
  credit_id: string;
  name: string;
  job: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Trailer {
  key: string;
  name?: string;
  type?: string;
}

export interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  media_type?: 'movie' | 'tv' | 'person';
  release_date?: string;
  first_air_date?: string;
}

export interface SearchHistoryItem {
  id: number;
  title: string;
  searchType: 'movie' | 'tv' | 'person';
  image?: string | null;
  createdAt?: string;
}

export interface WatchHistoryItem {
  contentId: number;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  currentTime: number;
  duration: number;
  seasonNumber?: number;
  episodeNumber?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  content?: T;
  message?: string;
}

export interface TrailerResponse {
  trailers: Trailer[];
}

export interface SimilarResponse {
  similar: Movie[];
}

export interface CreditsResponse {
  credits: Credits;
}

export interface ContentDetailsResponse {
  content: Movie;
  subtitles?: string;
}

export interface SearchResponse {
  success: boolean;
  content: SearchResult[];
}

export interface ErrorResponse {
  message: string;
  status?: number;
  response?: {
    status: number;
  };
}
