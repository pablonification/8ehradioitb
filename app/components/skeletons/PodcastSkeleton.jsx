export default function PodcastSkeleton() {
  return (
    <div className="flex items-start gap-4 sm:gap-6 py-8 border-b border-gray-200/80 animate-pulse">
      {/* Image skeleton */}
      <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gray-300 rounded-2xl flex-shrink-0" />

      {/* Content skeleton */}
      <div className="flex-1 space-y-3">
        <div className="h-6 bg-gray-300 rounded w-3/4" /> {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-1/2" /> {/* Subtitle */}
        <div className="h-16 bg-gray-200 rounded w-full" /> {/* Description */}
        <div className="flex justify-between items-center mt-4">
          <div className="h-4 bg-gray-200 rounded w-32" /> {/* Date/duration */}
          <div className="w-12 h-12 bg-gray-300 rounded-full" />{" "}
          {/* Play button */}
        </div>
      </div>
    </div>
  );
}
