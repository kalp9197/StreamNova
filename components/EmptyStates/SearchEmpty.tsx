'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface SearchEmptyProps {
  query?: string;
}

const SearchEmpty = ({ query }: SearchEmptyProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <Search className="size-24 text-gray-700 mx-auto mb-6" />
      <h2 className="text-3xl font-bold mb-4">
        {query ? `No results for "${query}"` : 'No results found'}
      </h2>
      <p className="text-gray-400 mb-4">
        Try searching for something else or browse trending content
      </p>
      <div className="flex flex-col items-center gap-2 mt-6">
        <p className="text-sm text-gray-500">Suggestions:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['Action', 'Comedy', 'Drama', 'Horror'].map((genre) => (
            <motion.span
              key={genre}
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
            >
              {genre}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SearchEmpty;
