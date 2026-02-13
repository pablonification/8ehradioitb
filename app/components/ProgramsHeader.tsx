'use client'

type ProgramsHeaderProps = {
  onScrollLeft: () => void
  onScrollRight: () => void
}

export default function ProgramsHeader({ onScrollLeft, onScrollRight }: ProgramsHeaderProps) {
  return (
    <div className="mb-12 flex items-center justify-between">
      <div className="text-left">
        <h2 className="font-heading mb-1 text-base text-red-600/90 sm:text-lg md:text-xl">
          Discover the Vibrant World of
        </h2>
        <h3 className="font-accent text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          8EH Radio Programs
        </h3>
      </div>
      {/* Slider Controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={onScrollLeft}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200/80 bg-white/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:border-gray-300 hover:bg-white/100 hover:shadow-lg sm:h-14 sm:w-14"
          aria-label="Scroll left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={onScrollRight}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200/80 bg-white/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:border-gray-300 hover:bg-white/100 hover:shadow-lg sm:h-14 sm:w-14"
          aria-label="Scroll right"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
