'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useContentStore } from '@/store/content';
import Navbar from '@/components/Navbar';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cachedGet } from '@/lib/apiClient';
import { ORIGINAL_IMG_BASE_URL, SMALL_IMG_BASE_URL } from '@/utils/constants';
import Link from 'next/link';
import FilterSidebar from '@/components/search/FilterSidebar';
import SearchEmpty from '@/components/EmptyStates/SearchEmpty';
import type { SearchResult } from '@/types';

const SearchPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    genres: [] as number[],
    yearRange: [1900, new Date().getFullYear()] as [number, number],
    rating: 0,
    sortBy: 'popularity',
  });
  const { setContentType } = useContentStore();

  const performSearch = async (term: string) => {
    if (!term.trim()) return;

    setIsLoading(true);
    try {
      const res = await cachedGet<{ content: SearchResult[] }>(
        `/api/v1/search/${encodeURIComponent(term)}`,
        {
          ttl: 5 * 60 * 1000, // 5 minutes cache
        }
      );
      setResults(res.content || []);
    } catch (error: unknown) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 404) {
        toast.error('Nothing found, please try a different search term');
      } else {
        toast.error('An error occurred, please try again later');
      }
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize search term from URL parameter and auto-search
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam && queryParam.trim()) {
      setSearchTerm(queryParam);
      performSearch(queryParam);
    } else {
      setSearchTerm('');
      setResults([]);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Update URL with search query - the effect will handle the search
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    router.push('/search');
  };

  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Filter by year
    filtered = filtered.filter((item) => {
      const year = item.release_date
        ? new Date(item.release_date).getFullYear()
        : item.first_air_date
          ? new Date(item.first_air_date).getFullYear()
          : null;
      if (!year) return true;
      return year >= filters.yearRange[0] && year <= filters.yearRange[1];
    });

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'popularity': {
          // For popularity, sort by release date (newer first) as a proxy
          const dateA = a.release_date || a.first_air_date || '';
          const dateB = b.release_date || b.first_air_date || '';
          return dateB.localeCompare(dateA);
        }
        case 'rating': {
          // Rating sorting not available for SearchResult, fallback to title
          return (a.title || a.name || '').localeCompare(
            b.title || b.name || ''
          );
        }
        case 'release_date': {
          const dateA = new Date(
            a.release_date || a.first_air_date || 0
          ).getTime();
          const dateB = new Date(
            b.release_date || b.first_air_date || 0
          ).getTime();
          return dateB - dateA;
        }
        case 'title':
          return (a.title || a.name || '').localeCompare(
            b.title || b.name || ''
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, filters]);

  return (
    <div className="bg-black min-h-screen text-white pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 items-stretch mb-8 max-w-2xl mx-auto"
          onSubmit={handleSearch}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search movies, TV shows, and people..."
              className="w-full pl-12 pr-12 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
              required
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="size-5" />
                Search
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center py-20"
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-400">Searching...</p>
              </div>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {filteredResults.map((result, index) => {
                const mediaType = result.media_type || 'movie';
                const profilePath = result.profile_path;
                const posterPath = result.poster_path;
                const profileSrc = profilePath
                  ? ORIGINAL_IMG_BASE_URL + profilePath
                  : null;
                const posterSrc = posterPath
                  ? SMALL_IMG_BASE_URL + posterPath
                  : null;

                // Skip if no image available
                if (!profilePath && !posterPath) return null;

                return (
                  <motion.div
                    key={`${result.id}-${mediaType}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
                  >
                    {mediaType === 'person' ? (
                      <div className="flex flex-col items-center p-4">
                        {profileSrc ? (
                          <motion.img
                            src={profileSrc}
                            alt={result.name}
                            className="w-32 h-32 rounded-full object-cover mb-4 border-2 border-gray-700 group-hover:border-red-600 transition-colors"
                            whileHover={{ scale: 1.05 }}
                          />
                        ) : null}
                        <h2 className="text-xl font-bold text-center">
                          {result.name}
                        </h2>
                        <span className="text-sm text-gray-400 mt-1 capitalize">
                          Person
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={`/watch/${result.id}`}
                        onClick={() => {
                          setContentType(mediaType === 'tv' ? 'tv' : 'movie');
                        }}
                      >
                        <div className="relative aspect-[2/3] overflow-hidden">
                          {posterSrc ? (
                            <motion.img
                              src={posterSrc}
                              alt={result.title || result.name}
                              className="w-full h-full object-cover transition-transform duration-300"
                              whileHover={{ scale: 1.1 }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">
                                No Image
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="p-4">
                          <h2 className="text-lg font-bold truncate">
                            {result.title || result.name}
                          </h2>
                          <div className="flex items-center justify-between mt-1">
                            {result.release_date && (
                              <p className="text-sm text-gray-400">
                                {new Date(result.release_date).getFullYear()}
                              </p>
                            )}
                            {result.first_air_date && (
                              <p className="text-sm text-gray-400">
                                {new Date(result.first_air_date).getFullYear()}
                              </p>
                            )}
                            <span className="text-xs text-gray-500 capitalize">
                              {mediaType === 'tv' ? 'TV Show' : 'Movie'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          ) : searchTerm ? (
            <SearchEmpty query={searchTerm} />
          ) : null}
        </AnimatePresence>

        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />
      </div>
    </div>
  );
};

const SearchPage = () => {
  return (
    <Suspense
      fallback={
        <div className="bg-black min-h-screen text-white pt-20">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
};

export default SearchPage;
