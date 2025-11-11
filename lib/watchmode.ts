// Watchmode API Client
const WATCHMODE_API_KEY = 'VM39WuN7pNf1cOAtd06kSr5l5kjdyzmDzkj3wJeM';
const WATCHMODE_BASE_URL = 'https://api.watchmode.com/v1';

export interface WatchmodeSource {
  source_id: number;
  name: string;
  type: 'sub' | 'rent' | 'buy' | 'free' | 'tve';
  region: string;
  ios_url?: string;
  android_url?: string;
  web_url?: string;
  format?: string;
  price?: number | null;
  seasons?: number[] | null;
  episodes?: number[] | null;
}

export interface WatchmodeTitleDetails {
  id: number;
  title: string;
  original_title: string;
  plot_overview: string;
  type: 'movie' | 'tv_series' | 'tv_special' | 'tv_miniseries' | 'short_film';
  runtime_minutes?: number;
  year?: number;
  end_year?: number;
  release_date?: string;
  imdb_id?: string;
  tmdb_id?: number;
  tmdb_type?: 'movie' | 'tv';
  genres?: number[];
  genre_names?: string[];
  user_rating?: number;
  critic_score?: number;
  us_rating?: string;
  poster?: string;
  backdrop?: string;
  original_language?: string;
  networks?: number[];
  network_names?: string[];
  relevance_percentile?: number;
}

export interface WatchmodeSearchResult {
  title_results?: Array<{
    id: number;
    name: string;
    type: string;
    year?: number;
    imdb_id?: string;
    tmdb_id?: number;
    tmdb_type?: string;
  }>;
  people_results?: Array<{
    id: number;
    name: string;
    main_profession?: string;
    imdb_id?: string;
    tmdb_id?: number;
  }>;
}

/**
 * Search for titles or people using external IDs or name
 */
export async function searchWatchmode(
  searchField: 'imdb_id' | 'tmdb_person_id' | 'tmdb_movie_id' | 'tmdb_tv_id' | 'name',
  searchValue: string,
  types?: 'tv' | 'movie' | 'person'
): Promise<WatchmodeSearchResult> {
  const params = new URLSearchParams({
    apiKey: WATCHMODE_API_KEY,
    search_field: searchField,
    search_value: searchValue,
  });

  if (types) {
    params.append('types', types);
  }

  const response = await fetch(`${WATCHMODE_BASE_URL}/search/?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Watchmode API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get title details by Watchmode ID, TMDB ID, or IMDB ID
 */
export async function getTitleDetails(
  titleId: string,
  options?: {
    appendToResponse?: string[];
    language?: string;
    regions?: string;
  }
): Promise<WatchmodeTitleDetails> {
  const params = new URLSearchParams({
    apiKey: WATCHMODE_API_KEY,
  });

  if (options?.appendToResponse) {
    params.append('append_to_response', options.appendToResponse.join(','));
  }
  if (options?.language) {
    params.append('language', options.language);
  }
  if (options?.regions) {
    params.append('regions', options.regions);
  }

  const response = await fetch(
    `${WATCHMODE_BASE_URL}/title/${titleId}/details/?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Watchmode API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get streaming sources for a title
 */
export async function getTitleSources(
  titleId: string,
  regions?: string
): Promise<WatchmodeSource[]> {
  try {
    const params = new URLSearchParams({
      apiKey: WATCHMODE_API_KEY,
    });

    if (regions) {
      params.append('regions', regions);
    }

    const response = await fetch(
      `${WATCHMODE_BASE_URL}/title/${titleId}/sources/?${params.toString()}`
    );

    if (!response.ok) {
      // If 404, return empty array (title might not have sources)
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Watchmode API error: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching Watchmode sources:', error);
    return [];
  }
}

/**
 * Get title sources by TMDB ID (convenience function)
 */
export async function getTitleSourcesByTMDB(
  tmdbId: number,
  contentType: 'movie' | 'tv',
  regions?: string
): Promise<WatchmodeSource[]> {
  const titleId = `${contentType}-${tmdbId}`;
  return getTitleSources(titleId, regions);
}

