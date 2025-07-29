"use client";

export default function ProgramsHeader({ onScrollLeft, onScrollRight }) {
  return (
    <div className="flex justify-between items-center mb-12">
      <div className="text-left">
        <h2 className="font-heading text-base sm:text-lg md:text-xl text-red-600/90 mb-1">
          Discover the Vibrant World of
        </h2>
        <h3 className="font-accent text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900">
          8EH Radio Programs
        </h3>
      </div>
      {/* Slider Controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={onScrollLeft}
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white/100 hover:border-gray-300 transition-all duration-200 flex items-center justify-center border border-gray-200/80 shadow-md hover:shadow-lg cursor-pointer"
          aria-label="Scroll left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
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
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white/100 hover:border-gray-300 transition-all duration-200 flex items-center justify-center border border-gray-200/80 shadow-md hover:shadow-lg cursor-pointer"
          aria-label="Scroll right"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
