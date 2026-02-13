export default function PodcastSkeleton() {
  return (
    <div className="flex animate-pulse items-start gap-4 border-b border-gray-200/80 py-8 sm:gap-6">
      {/* Image skeleton */}
      <div className="h-28 w-28 flex-shrink-0 rounded-2xl bg-gray-300 sm:h-32 sm:w-32 md:h-40 md:w-40" />

      {/* Content skeleton */}
      <div className="flex-1 space-y-3">
        <div className="h-6 w-3/4 rounded bg-gray-300" /> {/* Title */}
        <div className="h-4 w-1/2 rounded bg-gray-200" /> {/* Subtitle */}
        <div className="h-16 w-full rounded bg-gray-200" /> {/* Description */}
        <div className="mt-4 flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-gray-200" /> {/* Date/duration */}
          <div className="h-12 w-12 rounded-full bg-gray-300" /> {/* Play button */}
        </div>
      </div>
    </div>
  )
}
