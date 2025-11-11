'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Play, ShoppingCart, Gift, Tv } from 'lucide-react';
import { cachedGet } from '@/lib/apiClient';

interface StreamingSource {
  source_id: number;
  name: string;
  type: 'sub' | 'rent' | 'buy' | 'free' | 'tve';
  region: string;
  ios_url?: string;
  android_url?: string;
  web_url?: string;
  format?: string;
  price?: number | null;
}

interface StreamingSourcesProps {
  contentId: string;
  contentType: 'movie' | 'tv';
}

const StreamingSources = ({
  contentId,
  contentType,
}: StreamingSourcesProps) => {
  const [sources, setSources] = useState<StreamingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoading(true);
        const res = await cachedGet<{
          success: boolean;
          sources: StreamingSource[];
        }>(
          `/api/v1/watchmode/sources/${contentId}?type=${contentType}&regions=US`,
          {
            ttl: 60 * 60 * 1000, // Cache for 1 hour
          }
        );
        if (res.success && res.sources) {
          setSources(res.sources);
        }
      } catch (err) {
        setError('Failed to load streaming sources');
        console.error('Error fetching streaming sources:', err);
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      fetchSources();
    }
  }, [contentId, contentType]);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'sub':
        return <Play className="size-4" />;
      case 'rent':
        return <ShoppingCart className="size-4" />;
      case 'buy':
        return <ShoppingCart className="size-4" />;
      case 'free':
        return <Gift className="size-4" />;
      case 'tve':
        return <Tv className="size-4" />;
      default:
        return <ExternalLink className="size-4" />;
    }
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'sub':
        return 'Subscription';
      case 'rent':
        return 'Rent';
      case 'buy':
        return 'Buy';
      case 'free':
        return 'Free';
      case 'tve':
        return 'TV Everywhere';
      default:
        return type;
    }
  };

  const getSourceTypeColor = (type: string) => {
    switch (type) {
      case 'sub':
        return 'bg-green-600/20 text-green-400 border-green-600/50';
      case 'rent':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/50';
      case 'buy':
        return 'bg-purple-600/20 text-purple-400 border-purple-600/50';
      case 'free':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50';
      case 'tve':
        return 'bg-orange-600/20 text-orange-400 border-orange-600/50';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/50';
    }
  };

  if (loading) {
    return (
      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-4">Where to Watch</h3>
        <div className="flex gap-4 flex-wrap">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 w-32 bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || sources.length === 0) {
    return null; // Don't show anything if there's an error or no sources
  }

  // Group sources by type
  const groupedSources = sources.reduce(
    (acc, source) => {
      if (!acc[source.type]) {
        acc[source.type] = [];
      }
      acc[source.type].push(source);
      return acc;
    },
    {} as Record<string, StreamingSource[]>
  );

  // Sort types: sub, free, rent, buy, tve
  const typeOrder = ['sub', 'free', 'rent', 'buy', 'tve'];
  const sortedTypes = typeOrder.filter((type) => groupedSources[type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-8 w-full"
    >
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <ExternalLink className="size-6 text-red-600" />
        Where to Watch
      </h3>

      {sortedTypes.map((type) => (
        <div key={type} className="mb-6">
          <h4 className="text-lg font-semibold mb-3 text-gray-300 capitalize">
            {getSourceTypeLabel(type)}
          </h4>
          <div className="flex flex-wrap gap-3">
            {groupedSources[type].map((source) => (
              <motion.a
                key={`${source.source_id}-${source.region}`}
                href={
                  source.web_url || source.ios_url || source.android_url || '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:border-opacity-100 ${getSourceTypeColor(
                  source.type
                )}`}
              >
                {getSourceIcon(source.type)}
                <span className="font-medium">{source.name}</span>
                {source.format && (
                  <span className="text-xs opacity-75">({source.format})</span>
                )}
                {source.price && source.type !== 'sub' && (
                  <span className="text-xs opacity-75">
                    ${source.price.toFixed(2)}
                  </span>
                )}
              </motion.a>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default StreamingSources;
