'use client';

const HomeScreenSkeleton = () => {
  return (
    <div className="h-screen text-white relative">
      <div className="absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center shimmer -z-10">
        <div className="text-center">
          <div className="h-16 w-96 bg-gray-800 rounded shimmer mb-4 mx-auto" />
          <div className="h-6 w-64 bg-gray-800 rounded shimmer mb-4 mx-auto" />
          <div className="h-4 w-80 bg-gray-800 rounded shimmer mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default HomeScreenSkeleton;
