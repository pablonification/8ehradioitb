import React from 'react'

type DropdownName = 'discover' | 'partnership'

type NavbarMobileProps = {
  isOpen: boolean
  openDropdown: DropdownName | null
  onDropdownToggle: (name: DropdownName) => void
  discoverLinks: React.ReactNode
  partnershipLinks: React.ReactNode
}

export default function NavbarMobile({
  isOpen,
  openDropdown,
  onDropdownToggle,
  discoverLinks,
  partnershipLinks,
}: NavbarMobileProps) {
  if (!isOpen) return null

  return (
    <div className="border-t border-gray-200 bg-white md:hidden">
      <nav className="flex flex-col px-4 pt-2 pb-4">
        <a
          href="/"
          className="font-body rounded-md px-3 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100 hover:text-[#D83232]"
        >
          Home
        </a>
        <a
          href="/podcast"
          className="font-body rounded-md px-3 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100 hover:text-[#D83232]"
        >
          Podcast
        </a>
        <a
          href="/blog"
          className="font-body rounded-md px-3 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100 hover:text-[#D83232]"
        >
          Blog
        </a>

        {/* Discover Dropdown for Mobile */}
        <div>
          <button
            onClick={() => onDropdownToggle('discover')}
            className="font-body flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-base font-medium text-gray-900 transition-colors hover:bg-gray-100 hover:text-[#D83232]"
          >
            <span>Discover</span>
            <svg
              className={`h-5 w-5 transition-transform ${
                openDropdown === 'discover' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            className={`mt-2 space-y-1 pl-4 ${openDropdown === 'discover' ? 'block' : 'hidden'}`}
          >
            {discoverLinks}
          </div>
        </div>

        {/* Partnership Dropdown for Mobile */}
        <div>
          <button
            onClick={() => onDropdownToggle('partnership')}
            className="font-body flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-base font-medium text-gray-900 transition-colors hover:bg-gray-100 hover:text-[#D83232]"
          >
            <span>Partnership</span>
            <svg
              className={`h-5 w-5 transition-transform ${
                openDropdown === 'partnership' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            className={`mt-2 space-y-1 pl-4 ${openDropdown === 'partnership' ? 'block' : 'hidden'}`}
          >
            {partnershipLinks}
          </div>
        </div>
      </nav>
    </div>
  )
}
