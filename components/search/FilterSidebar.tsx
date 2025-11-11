'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Filter } from 'lucide-react';
import { GENRES } from '@/utils/constants';

interface FilterSidebarProps {
  filters: {
    genres: number[];
    yearRange: [number, number];
    rating: number;
    sortBy: string;
  };
  onFiltersChange: (filters: {
    genres: number[];
    yearRange: [number, number];
    rating: number;
    sortBy: string;
  }) => void;
  isOpen: boolean;
  onClose: () => void;
}

const FilterSidebar = ({
  filters,
  onFiltersChange,
  isOpen,
  onClose,
}: FilterSidebarProps) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleGenreToggle = (genreId: number) => {
    const newGenres = localFilters.genres.includes(genreId)
      ? localFilters.genres.filter((id) => id !== genreId)
      : [...localFilters.genres, genreId];
    setLocalFilters({ ...localFilters, genres: newGenres });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: {
      genres: number[];
      yearRange: [number, number];
      rating: number;
      sortBy: string;
    } = {
      genres: [],
      yearRange: [1900, new Date().getFullYear()],
      rating: 0,
      sortBy: 'popularity',
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const currentYear = new Date().getFullYear();

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
        />
      )}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-800 z-50 overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Filter className="size-6 text-red-600" />
            Filters
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="size-6" />
          </motion.button>
        </div>

        {/* Genres */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(GENRES).map(([id, name]) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGenreToggle(parseInt(id))}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  localFilters.genres.includes(parseInt(id))
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Year Range */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Year Range</h3>
          <div className="flex gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">From</label>
              <input
                type="number"
                min="1900"
                max={currentYear}
                value={localFilters.yearRange[0]}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    yearRange: [
                      parseInt(e.target.value) || 1900,
                      localFilters.yearRange[1],
                    ],
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">To</label>
              <input
                type="number"
                min="1900"
                max={currentYear}
                value={localFilters.yearRange[1]}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    yearRange: [
                      localFilters.yearRange[0],
                      parseInt(e.target.value) || currentYear,
                    ],
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Minimum Rating:{' '}
            {localFilters.rating > 0 ? localFilters.rating.toFixed(1) : 'Any'}
          </h3>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={localFilters.rating}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                rating: parseFloat(e.target.value),
              })
            }
            className="w-full"
          />
        </div>

        {/* Sort */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Sort By</h3>
          <select
            value={localFilters.sortBy}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, sortBy: e.target.value })
            }
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
          >
            <option value="popularity">Popularity</option>
            <option value="rating">Rating</option>
            <option value="release_date">Release Date</option>
            <option value="title">Title</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleApply}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold"
          >
            Apply Filters
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold"
          >
            Reset
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

export default FilterSidebar;
