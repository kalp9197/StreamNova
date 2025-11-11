'use client';

import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { SMALL_IMG_BASE_URL } from '@/utils/constants';
import { Trash, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cachedDelete } from '@/lib/apiClient';
import { useSearchHistoryStore } from '@/store/searchHistory';
import type { SearchHistoryItem } from '@/types';

type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
type FilterType = 'all' | 'movie' | 'tv' | 'person';

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const month = monthNames[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();

  return `${month} ${day}, ${year}`;
}

const SearchHistoryPage = () => {
  const { searchHistory, fetchSearchHistory } = useSearchHistoryStore();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  useEffect(() => {
    fetchSearchHistory(true);
  }, [fetchSearchHistory]);

  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...(searchHistory || [])];

    // Apply filter
    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.searchType === filterType);
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        case 'date-asc':
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchHistory, filterType, sortOption]);

  const handleDelete = async (entry: SearchHistoryItem) => {
    try {
      await cachedDelete(`/api/v1/search/history/${entry.id}`, {
        invalidateCache: ['/api/v1/search/history'],
      });
      fetchSearchHistory(true);
      toast.success('Item deleted successfully');
    } catch (_error) {
      toast.error('Failed to delete search item');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      const deletePromises = Array.from(selectedItems).map((id) =>
        cachedDelete(`/api/v1/search/history/${id}`, {
          invalidateCache: ['/api/v1/search/history'],
        })
      );

      await Promise.all(deletePromises);
      fetchSearchHistory(true);
      setSelectedItems(new Set());
      setIsBulkMode(false);
      toast.success(`${selectedItems.size} items deleted successfully`);
    } catch (_error) {
      toast.error('Failed to delete items');
    }
  };

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(
        new Set(filteredAndSortedHistory.map((item) => item.id))
      );
    }
  };

  if (searchHistory?.length === 0) {
    return (
      <div className="bg-black min-h-screen text-white pt-20">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Search History</h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-96"
          >
            <p className="text-xl text-gray-400 mb-4">
              No search history found
            </p>
            <p className="text-gray-500">
              Start searching to see your history here
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pt-20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold">Search History</h1>

          <div className="flex gap-2 flex-wrap">
            {/* Filter */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="all">All Types</option>
                <option value="movie">Movies</option>
                <option value="tv">TV Shows</option>
                <option value="person">People</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </div>

            {/* Bulk Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedItems(new Set());
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                isBulkMode
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              <CheckSquare className="size-5" />
              {isBulkMode ? 'Cancel' : 'Bulk Delete'}
            </motion.button>

            {/* Bulk Delete Button */}
            {isBulkMode && selectedItems.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Trash className="size-5" />
                Delete ({selectedItems.size})
              </motion.button>
            )}
          </div>
        </div>

        {isBulkMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-gray-800 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {selectedItems.size === filteredAndSortedHistory.length ? (
                  <CheckSquare className="size-5" />
                ) : (
                  <Square className="size-5" />
                )}
              </button>
              <span className="text-gray-300">
                {selectedItems.size} of {filteredAndSortedHistory.length}{' '}
                selected
              </span>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="wait">
            {filteredAndSortedHistory.map((entry) => {
              const imageSrc = entry.image
                ? SMALL_IMG_BASE_URL + entry.image
                : null;
              const isSelected = selectedItems.has(entry.id);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-gray-800 p-4 rounded-lg transition-all ${
                    isSelected ? 'ring-2 ring-red-600' : ''
                  } ${isBulkMode ? 'cursor-pointer' : ''}`}
                  onClick={() => isBulkMode && toggleSelectItem(entry.id)}
                >
                  <div className="flex items-start gap-4">
                    {isBulkMode && (
                      <div className="mt-1">
                        {isSelected ? (
                          <CheckSquare className="size-5 text-red-600" />
                        ) : (
                          <Square className="size-5 text-gray-500" />
                        )}
                      </div>
                    )}
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt="History image"
                        className="size-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="size-16 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-lg block truncate">
                        {entry.title}
                      </span>
                      <span className="text-gray-400 text-sm block">
                        {entry.createdAt
                          ? formatDate(entry.createdAt)
                          : 'Unknown date'}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`py-1 px-3 rounded-full text-xs font-medium whitespace-nowrap ${
                          entry.searchType === 'movie'
                            ? 'bg-red-600'
                            : entry.searchType === 'tv'
                              ? 'bg-blue-600'
                              : 'bg-green-600'
                        }`}
                      >
                        {entry.searchType[0].toUpperCase() +
                          entry.searchType.slice(1)}
                      </span>
                      {!isBulkMode && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          aria-label="Delete item"
                        >
                          <Trash className="size-5" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredAndSortedHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-xl text-gray-400">
              No items found with the selected filters
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchHistoryPage;
