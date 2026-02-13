import React from 'react'

type DropdownName = 'discover' | 'partnership'

type NavbarDesktopProps = {
  openDropdown: DropdownName | null
  onDropdownToggle: (name: DropdownName) => void
  discoverLinks: React.ReactNode
  partnershipLinks: React.ReactNode
}

export default function NavbarDesktop({
  openDropdown,
  onDropdownToggle,
  discoverLinks,
  partnershipLinks,
}: NavbarDesktopProps) {
  return (
    <nav className="hidden items-center space-x-8 md:flex">
      <a
        href="/"
        className="font-body text-base font-normal text-gray-900 transition-colors hover:text-[#D83232]"
      >
        Home
      </a>
      <a
        href="/podcast"
        className="font-body text-base font-normal text-gray-900 transition-colors hover:text-[#D83232]"
      >
        Podcast
      </a>
      <a
        href="/blog"
        className="font-body text-base font-normal text-gray-900 transition-colors hover:text-[#D83232]"
      >
        Blog
      </a>

      {/* Discover Dropdown */}
      <div className="relative">
        <button
          onClick={() => onDropdownToggle('discover')}
          className="font-body flex items-center text-base font-normal text-gray-900 transition-colors hover:text-[#D83232]"
        >
          Discover
          <svg
            className={`ml-1 h-4 w-4 transition-transform ${
              openDropdown === 'discover' ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={`absolute top-full left-0 z-50 mt-2 w-48 rounded-lg bg-white py-2 shadow-lg ${
            openDropdown === 'discover' ? 'block' : 'hidden'
          }`}
        >
          {discoverLinks}
        </div>
      </div>

      {/* Partnership Dropdown */}
      <div className="relative">
        <button
          onClick={() => onDropdownToggle('partnership')}
          className="font-body flex items-center text-base font-normal text-gray-900 transition-colors hover:text-[#D83232]"
        >
          Partnership
          <svg
            className={`ml-1 h-4 w-4 transition-transform ${
              openDropdown === 'partnership' ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={`absolute top-full left-0 z-50 mt-2 w-48 rounded-lg bg-white py-2 shadow-lg ${
            openDropdown === 'partnership' ? 'block' : 'hidden'
          }`}
        >
          {partnershipLinks}
        </div>
      </div>
    </nav>
  )
}
