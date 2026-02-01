export default function NewsCardSkeleton() {
  return (
    <div className="bg-gradient-to-b from-[#FEF9E7] to-[#F5E6A3] rounded-3xl shadow-sm overflow-hidden p-4 animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 bg-gray-300 rounded-xl mb-6" />

      {/* Content skeleton */}
      <div className="space-y-3 px-2">
        <div className="h-4 bg-gray-300 rounded w-20" /> {/* Category */}
        <div className="h-6 bg-gray-300 rounded w-full" /> {/* Title line 1 */}
        <div className="h-6 bg-gray-300 rounded w-3/4" /> {/* Title line 2 */}
        <div className="h-4 bg-gray-200 rounded w-full" />{" "}
        {/* Description line 1 */}
        <div className="h-4 bg-gray-200 rounded w-5/6" />{" "}
        {/* Description line 2 */}
        <div className="flex items-center gap-3 mt-6">
          <div className="w-10 h-10 bg-gray-300 rounded-full" /> {/* Avatar */}
          <div>
            <div className="h-4 bg-gray-300 rounded w-24 mb-1" /> {/* Author */}
            <div className="h-3 bg-gray-200 rounded w-16" /> {/* Date */}
          </div>
        </div>
      </div>
    </div>
  );
}
