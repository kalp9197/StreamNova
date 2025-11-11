'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useContentStore } from '@/store/content';
import { SMALL_IMG_BASE_URL } from '@/utils/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { cachedGet } from '@/lib/apiClient';
import { useSearchHistoryStore } from '@/store/searchHistory';
import type { SearchResult } from '@/types';

// Memoized search history item component
const SearchHistoryItem = memo(
  ({
    item,
    index,
    isSelected,
    onSelect,
  }: {
    item: { id: number; title: string; searchType: 'movie' | 'tv' | 'person' };
    index: number;
    isSelected: boolean;
    onSelect: () => void;
  }) => {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Link
          href="/search"
          onClick={onSelect}
          className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 transition-colors ${
            isSelected ? 'bg-gray-800' : ''
          }`}
        >
          <Clock className="size-4 text-gray-500" />
          <span className="text-white">{item.title}</span>
          <span className="ml-auto text-xs text-gray-500 capitalize">
            {item.searchType}
          </span>
        </Link>
      </motion.div>
    );
  }
);

SearchHistoryItem.displayName = 'SearchHistoryItem';

// Memoized search result item component
const SearchResultItem = memo(
  ({
    result,
    index,
    isSelected,
    onSelect,
  }: {
    result: SearchResult;
    index: number;
    globalIndex?: number;
    isSelected: boolean;
    onSelect: () => void;
  }) => {
    const imagePath = result.poster_path || result.profile_path;
    const imageSrc = imagePath ? SMALL_IMG_BASE_URL + imagePath : null;
    const title = result.title || result.name || 'Unknown';
    const mediaType = result.media_type || 'movie';

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Link
          href={mediaType === 'person' ? '#' : `/watch/${result.id}`}
          onClick={onSelect}
          className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 transition-colors ${
            isSelected ? 'bg-gray-800' : ''
          }`}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={title}
              className="w-12 h-16 object-cover rounded"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
              <span className="text-xs text-gray-500">No Image</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white truncate">{title}</p>
            <p className="text-xs text-gray-400 capitalize">
              {mediaType === 'tv' ? 'TV Show' : mediaType === 'person' ? 'Person' : 'Movie'}
            </p>
          </div>
        </Link>
      </motion.div>
    );
  }
);

SearchResultItem.displayName = 'SearchResultItem';

const EnhancedSearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLAnchorElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const router = useRouter();
  const { setContentType } = useContentStore();
  const { searchHistory, fetchSearchHistory } = useSearchHistoryStore();

  // Adaptive debounce: shorter for cached results, longer for new searches
  const debouncedQuery = useDebounce(searchQuery.trim(), 300);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && resultsContainerRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [selectedIndex]);

  const performSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        setError(null);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsLoading(true);
      setError(null);

      try {
        const res = await cachedGet<{
          success: boolean;
          content: SearchResult[];
        }>(`/api/v1/search/${encodeURIComponent(query)}`, {
          ttl: 5 * 60 * 1000, // 5 minutes cache
        });

        // Check if request was aborted
        if (signal.aborted) return;

        if (res.success && res.content) {
          setSearchResults(res.content.slice(0, 8));
        } else {
          setSearchResults([]);
        }
      } catch (error: unknown) {
        // Don't set error if request was aborted
        if (signal.aborted) return;

        const err = error as { response?: { status: number }; name?: string };
        // Handle 404 as empty results, not an error
        if (err.response?.status === 404) {
          setSearchResults([]);
        } else if (err.name !== 'AbortError') {
          setError('Failed to search. Please try again.');
          setSearchResults([]);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  // Fetch search history (cached)
  useEffect(() => {
    if (isOpen) {
      fetchSearchHistory();
    }
  }, [isOpen, fetchSearchHistory]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setSearchResults([]);
      setError(null);
    }

    // Cleanup: cancel request on unmount or query change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, performSearch]);

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults, searchHistory]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setError(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Memoize handleSelectResult to prevent recreation
  const handleSelectResult = useCallback(
    (index: number) => {
      if (index < searchHistory.length) {
        const item = searchHistory[index];
        setContentType(
          item.searchType === 'person' ? 'movie' : item.searchType
        );
        router.push(`/search`);
        setIsOpen(false);
        setSearchQuery('');
      } else {
        const result = searchResults[index - searchHistory.length];
        if (!result) return;

        const mediaType = result.media_type || 'movie';
        if (mediaType === 'person') {
          setIsOpen(false);
          return;
        }
        setContentType(mediaType === 'tv' ? 'tv' : 'movie');
        router.push(`/watch/${result.id}`);
        setIsOpen(false);
        setSearchQuery('');
      }
    },
    [searchHistory, searchResults, setContentType, router]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setIsOpen(false);
      }
    },
    [searchQuery, router]
  );

  // Enhanced keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const totalItems = searchResults.length + searchHistory.length;

      // Prevent default for navigation keys
      if (
        ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'Escape'].includes(
          e.key
        )
      ) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowDown':
          setSelectedIndex((prev) => {
            const next = prev < totalItems - 1 ? prev + 1 : prev;
            return next;
          });
          break;

        case 'ArrowUp':
          setSelectedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : -1;
            return next;
          });
          break;

        case 'Home':
          setSelectedIndex(0);
          break;

        case 'End':
          setSelectedIndex(Math.max(0, totalItems - 1));
          break;

        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < totalItems) {
            handleSelectResult(selectedIndex);
          } else if (searchQuery.trim().length >= 2) {
            handleSearch(e as unknown as React.FormEvent);
          }
          break;

        case 'Escape':
          setIsOpen(false);
          setSearchQuery('');
          setSearchResults([]);
          inputRef.current?.blur();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    selectedIndex,
    searchResults,
    searchHistory,
    searchQuery,
    handleSelectResult,
    handleSearch,
  ]);


  // Memoize computed values
  const hasResults = useMemo(
    () => searchResults.length > 0 || searchHistory.length > 0,
    [searchResults.length, searchHistory.length]
  );

  const showResults = useMemo(
    () => isOpen && (hasResults || searchQuery.length >= 2 || isLoading),
    [isOpen, hasResults, searchQuery.length, isLoading]
  );

  // Memoize search history items with better optimization
  const searchHistoryItems = useMemo(() => {
    return searchHistory.map((item, idx) => (
      <SearchHistoryItem
        key={`history-${item.id}-${item.searchType}-${idx}`}
        item={item}
        index={idx}
        isSelected={selectedIndex === idx}
        onSelect={() => {
          setContentType(
            item.searchType === 'person' ? 'movie' : item.searchType
          );
          setIsOpen(false);
          setSearchQuery('');
        }}
      />
    ));
  }, [searchHistory, selectedIndex, setContentType]);

  // Memoize search result items with ref callback for scroll
  const searchResultItems = useMemo(() => {
    return searchResults.map((result, idx) => {
      const globalIdx = searchHistory.length + idx;
      const isSelected = selectedIndex === globalIdx;
      const mediaType = result.media_type || 'movie';

      return (
        <div
          key={`result-${result.id}-${mediaType}-${idx}`}
          ref={
            isSelected
              ? (el) => {
                  if (el) {
                    selectedItemRef.current = el.querySelector(
                      'a'
                    ) as HTMLAnchorElement;
                  }
                }
              : null
          }
        >
          <SearchResultItem
            result={result}
            index={idx}
            globalIndex={globalIdx}
            isSelected={isSelected}
            onSelect={() => {
              if (mediaType !== 'person') {
                setContentType(mediaType === 'tv' ? 'tv' : 'movie');
                setIsOpen(false);
                setSearchQuery('');
              }
            }}
          />
        </div>
      );
    });
  }, [
    searchResults,
    searchHistory.length,
    selectedIndex,
    setContentType,
  ]);

  return (
    <div ref={searchRef} className="relative">
      {/* Search Button/Input */}
      <div className="relative">
        <form onSubmit={handleSearch} className="flex items-center">
          <div
            className={`flex items-center bg-black/70 border border-gray-700 rounded-md transition-all duration-300 ${
              isOpen ? 'w-96 border-gray-500' : 'w-64'
            }`}
            onClick={() => {
              setIsOpen(true);
              inputRef.current?.focus();
            }}
          >
            <Search className="size-5 ml-3 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(-1);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search movies, TV shows, and people..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 px-3 py-2 outline-none"
              autoComplete="off"
              aria-label="Search for movies, TV shows, or people"
              aria-expanded={isOpen}
              aria-controls="search-results"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSearch();
                }}
                className="mr-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-[600px] overflow-hidden"
            id="search-results"
            role="listbox"
            aria-label="Search results"
          >
            {/* Results Container */}
            <div
              ref={resultsContainerRef}
              className="overflow-y-auto max-h-[500px]"
              role="list"
            >
              {/* Search History */}
              {searchQuery.length < 2 && searchHistory.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400 uppercase tracking-wide">
                    <Clock className="size-3" />
                    Recent Searches
                  </div>
                  {searchHistoryItems}
                </div>
              )}

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="p-2">
                  {isLoading ? (
                    <div
                      className="flex items-center justify-center py-8"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      <span className="sr-only">Loading search results...</span>
                    </div>
                  ) : error ? (
                    <div
                      className="px-3 py-4 text-center text-red-400 text-sm"
                      role="alert"
                    >
                      {error}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400 uppercase tracking-wide">
                        <TrendingUp className="size-3" />
                        Results
                      </div>
                      {searchResultItems}
                    </>
                  ) : (
                    <div className="px-3 py-8 text-center text-gray-400">
                      No results found for &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {searchQuery.length < 2 &&
                searchHistory.length === 0 &&
                !isLoading && (
                  <div className="px-3 py-8 text-center text-gray-400">
                    Start typing to search...
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(EnhancedSearchBar);
