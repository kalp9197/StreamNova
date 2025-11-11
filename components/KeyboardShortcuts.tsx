'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Press '?' to open shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setIsOpen(true);
      }
      // Press 'Escape' to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const shortcuts = [
    { key: '/', description: 'Focus search bar' },
    { key: 'Esc', description: 'Close modals/dropdowns' },
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: '↑ ↓', description: 'Navigate search results' },
    { key: 'Enter', description: 'Select/search' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/80 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <Keyboard className="size-6 text-red-600" />
                  <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="size-6" />
                </motion.button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={shortcut.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
                    >
                      <span className="text-gray-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm font-mono">
                        {shortcut.key}
                      </kbd>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcuts;
