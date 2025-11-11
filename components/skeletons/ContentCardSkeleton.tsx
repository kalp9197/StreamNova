'use client';

const ContentCardSkeleton = () => {
  return (
    <div className="min-w-[250px] md:min-w-[300px]">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800">
        <div className="absolute inset-0 shimmer" />
      </div>
      <div className="mt-2 h-4 bg-gray-800 rounded shimmer w-3/4 mx-auto" />
    </div>
  );
};

export default ContentCardSkeleton;
