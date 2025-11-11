'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFavoritesStore } from '@/store/favorites';
import { useAuthStore } from '@/store/authUser';
import { useContentStore } from '@/store/content';
import { SMALL_IMG_BASE_URL } from '@/utils/constants';
import Link from 'next/link';
import FavoriteButton from '@/components/FavoriteButton';
import FavoritesEmpty from '@/components/EmptyStates/FavoritesEmpty';

const FavoritesPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { favorites, isLoading, fetchFavorites } = useFavoritesStore();
  const { setContentType } = useContentStore();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchFavorites(true);
  }, [user, router, fetchFavorites]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen text-white pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading favorites...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="bg-black min-h-screen text-white pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <FavoritesEmpty />
        </div>
      </div>
    );
  }

  // Group favorites by content type
  const movies = favorites.filter((item) => item.contentType === 'movie');
  const tvShows = favorites.filter((item) => item.contentType === 'tv');

  return (
    <div className="bg-black min-h-screen text-white pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Heart className="size-10 text-red-600 fill-red-600" />
            My Favorites
          </h1>
          <p className="text-gray-400">
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
          </p>
        </motion.div>

        {movies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6">
              Movies ({movies.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map((item, index) => {
                const imageSrc = item.posterPath
                  ? SMALL_IMG_BASE_URL + item.posterPath
                  : item.backdropPath
                    ? SMALL_IMG_BASE_URL + item.backdropPath
                    : null;

                return (
                  <motion.div
                    key={`movie-${item.contentId}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    <Link
                      href={`/watch/${item.contentId}`}
                      onClick={() => setContentType('movie')}
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
                        {imageSrc ? (
                          <motion.img
                            src={imageSrc}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300"
                            whileHover={{ scale: 1.05 }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <Heart className="size-12 text-gray-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Favorite Button */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                          <FavoriteButton
                            contentId={item.contentId}
                            contentType={item.contentType}
                            title={item.title}
                            posterPath={item.posterPath}
                            backdropPath={item.backdropPath}
                            size="md"
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-center text-sm font-medium truncate">
                        {item.title}
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {tvShows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6">
              TV Shows ({tvShows.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tvShows.map((item, index) => {
                const imageSrc = item.posterPath
                  ? SMALL_IMG_BASE_URL + item.posterPath
                  : item.backdropPath
                    ? SMALL_IMG_BASE_URL + item.backdropPath
                    : null;

                return (
                  <motion.div
                    key={`tv-${item.contentId}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    <Link
                      href={`/watch/${item.contentId}`}
                      onClick={() => setContentType('tv')}
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
                        {imageSrc ? (
                          <motion.img
                            src={imageSrc}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300"
                            whileHover={{ scale: 1.05 }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <Heart className="size-12 text-gray-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Favorite Button */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                          <FavoriteButton
                            contentId={item.contentId}
                            contentType={item.contentType}
                            title={item.title}
                            posterPath={item.posterPath}
                            backdropPath={item.backdropPath}
                            size="md"
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-center text-sm font-medium truncate">
                        {item.title}
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
