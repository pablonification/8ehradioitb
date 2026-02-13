'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import NavbarAudio from './navbar/NavbarAudio'
import NavbarMobile from './navbar/NavbarMobile'
import NavbarDesktop from './navbar/NavbarDesktop'

type DropdownName = 'discover' | 'partnership'

export default function Navbar() {
  const router = useRouter()
  const [openDropdown, setOpenDropdown] = useState<DropdownName | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navbarRef = useRef<HTMLElement | null>(null)
  const [onAir, setOnAir] = useState(false)
  const [playerTitle, setPlayerTitle] = useState('')

  const handleDropdown = (dropdownName: DropdownName) => {
    setOpenDropdown((prev) => (prev === dropdownName ? null : dropdownName))
  }

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev)
    setOpenDropdown(null)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        navbarRef.current &&
        event.target instanceof Node &&
        !navbarRef.current.contains(event.target)
      ) {
        setOpenDropdown(null)
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    fetch('/api/stream-config')
      .then((res) => res.json())
      .then((data) => setOnAir(typeof data?.onAir === 'boolean' ? data.onAir : true))
  }, [])

  useEffect(() => {
    fetch('/api/player-config')
      .then((res) => res.json())
      .then((data) => setPlayerTitle(data?.title || ''))
  }, [])

  const discoverLinks = (
    <>
      <a
        href="/programs"
        className="font-body block px-4 py-2 text-base text-gray-700 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center">
            <Image
              src="/radio-icon.svg"
              alt="Podcast"
              width={20}
              height={20}
              style={{ position: 'relative', top: '0.5px' }}
              priority
            />
          </div>
          Programs
        </div>
      </a>
      <a
        href="/about-us"
        className="font-body block px-4 py-2 text-base text-gray-700 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center">
            <Image
              src="/aboutus-icon.svg"
              alt="About Us"
              width={18}
              height={18}
              style={{ position: 'relative', top: '1px' }}
              priority
            />
          </div>
          About Us
        </div>
      </a>
      <a
        href="/faq"
        className="font-body block px-4 py-2 text-base text-gray-700 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center">
            <Image
              src="/faq-icon.svg"
              alt="FAQ"
              width={22}
              height={22}
              style={{ position: 'relative', top: '1px' }}
              priority
            />
          </div>
          FAQ
        </div>
      </a>
    </>
  )

  const partnershipLinks = (
    <>
      <a
        href="/media-partner"
        className="font-body block px-4 py-2 text-base text-gray-700 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center">
            <Image
              src="/medpart-icon.svg"
              alt="Media Partner"
              width={22}
              height={22}
              style={{ position: 'relative', top: '1px' }}
              priority
            />
          </div>
          Media Partner
        </div>
      </a>
      <a
        href="/agency"
        className="font-body block px-4 py-2 text-base text-gray-700 hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center">
            <Image
              src="/agency-icon.svg"
              alt="Agency"
              width={22}
              height={22}
              style={{ position: 'relative', top: '1px' }}
              priority
            />
          </div>
          Agency
        </div>
      </a>
    </>
  )

  return (
    <header className="border-b border-gray-100 bg-white" ref={navbarRef}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo + Mobile Play Button + On Air Mobile */}
          <div className="flex items-center space-x-3">
            <Image
              src="/8eh.png"
              alt="8EH Logo"
              width={61}
              height={61}
              className="cursor-pointer"
              onClick={() => router.push('/')}
              priority
            />

            <NavbarAudio variant="mobile" onAir={onAir} />

            {onAir && (
              <span className="font-body flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                <span className="ml-1 text-sm font-semibold text-red-600">On Air</span>
              </span>
            )}
          </div>

          <NavbarDesktop
            openDropdown={openDropdown}
            onDropdownToggle={handleDropdown}
            discoverLinks={discoverLinks}
            partnershipLinks={partnershipLinks}
          />

          <NavbarAudio variant="desktop" onAir={onAir} />

          <div className="md:hidden">
            <button
              onClick={handleMobileMenuToggle}
              className="text-gray-900 transition-colors hover:text-[#D83232]"
            >
              <svg
                className="h-6 w-6 cursor-pointer"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <NavbarMobile
        isOpen={isMobileMenuOpen}
        openDropdown={openDropdown}
        onDropdownToggle={handleDropdown}
        discoverLinks={discoverLinks}
        partnershipLinks={partnershipLinks}
      />
    </header>
  )
}
