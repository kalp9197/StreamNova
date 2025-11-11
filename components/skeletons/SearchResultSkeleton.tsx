'use client';

const SearchResultSkeleton = () => {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
        <div className="absolute inset-0 shimmer" />
      </div>
      <div className="p-4">
        <div className="h-5 bg-gray-800 rounded shimmer mb-2" />
        <div className="h-4 bg-gray-800 rounded shimmer w-2/3" />
      </div>
    </div>
  );
};

export default SearchResultSkeleton;
