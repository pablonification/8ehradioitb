export default function NewsCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl bg-gradient-to-b from-[#FEF9E7] to-[#F5E6A3] p-4 shadow-sm">
      {/* Image skeleton */}
      <div className="mb-6 h-48 rounded-xl bg-gray-300" />

      {/* Content skeleton */}
      <div className="space-y-3 px-2">
        <div className="h-4 w-20 rounded bg-gray-300" /> {/* Category */}
        <div className="h-6 w-full rounded bg-gray-300" /> {/* Title line 1 */}
        <div className="h-6 w-3/4 rounded bg-gray-300" /> {/* Title line 2 */}
        <div className="h-4 w-full rounded bg-gray-200" /> {/* Description line 1 */}
        <div className="h-4 w-5/6 rounded bg-gray-200" /> {/* Description line 2 */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-300" /> {/* Avatar */}
          <div>
            <div className="mb-1 h-4 w-24 rounded bg-gray-300" /> {/* Author */}
            <div className="h-3 w-16 rounded bg-gray-200" /> {/* Date */}
          </div>
        </div>
      </div>
    </div>
  )
}
