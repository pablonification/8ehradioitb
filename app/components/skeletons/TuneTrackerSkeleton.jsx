export default function TuneTrackerSkeleton() {
  return (
    <div className="flex items-center p-3 rounded-2xl bg-white/70 border border-gray-200/80 animate-pulse">
      {/* Number */}
      <div className="w-8 h-4 bg-gray-300 rounded mr-4" />

      {/* Image */}
      <div className="w-14 h-14 bg-gray-300 rounded-full mx-4 flex-shrink-0" />

      {/* Text */}
      <div className="flex-grow space-y-2">
        <div className="h-5 bg-gray-300 rounded w-3/4" /> {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-1/2" /> {/* Artist */}
      </div>

      {/* Play button */}
      <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0" />
    </div>
  );
}
