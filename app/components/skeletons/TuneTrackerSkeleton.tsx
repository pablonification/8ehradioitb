export default function TuneTrackerSkeleton() {
  return (
    <div className="flex animate-pulse items-center rounded-2xl border border-gray-200/80 bg-white/70 p-3">
      {/* Number */}
      <div className="mr-4 h-4 w-8 rounded bg-gray-300" />

      {/* Image */}
      <div className="mx-4 h-14 w-14 flex-shrink-0 rounded-full bg-gray-300" />

      {/* Text */}
      <div className="flex-grow space-y-2">
        <div className="h-5 w-3/4 rounded bg-gray-300" /> {/* Title */}
        <div className="h-4 w-1/2 rounded bg-gray-200" /> {/* Artist */}
      </div>

      {/* Play button */}
      <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-300" />
    </div>
  )
}
