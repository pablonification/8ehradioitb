"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const navbarRef = useRef(null);

  const handleDropdown = (dropdownName) => {
    setOpenDropdown((prev) => (prev === dropdownName ? null : dropdownName));
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev);
    setOpenDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setOpenDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Listen for audio state changes from the main page
    const handleAudioStateChange = (event) => {
      setIsPlaying(event.detail.isPlaying);
    };

    window.addEventListener("audioStateChanged", handleAudioStateChange);

    return () => {
      window.removeEventListener("audioStateChanged", handleAudioStateChange);
    };
  }, []);

  const handlePlayClick = () => {
    // Dispatch custom event to trigger player control
    window.dispatchEvent(new CustomEvent("triggerPlayerControl"));
  };

  const discoverLinks = (
    <>
      <a
        href="#"
        className="block px-4 py-2 text-gray-700 hover:bg-[#ecdbdb] font-body text-base"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <Image
              src="/radio-icon.svg"
              alt="Podcast"
              width={20}
              height={20}
              style={{ position: "relative", top: "0.5px" }}
            />
          </div>
          Programs
        </div>
      </a>
      <a
        href="/about-us"
        className="block px-4 py-2 text-gray-700 hover:bg-[#ecdbdb] font-body text-base"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <Image
              src="/aboutus-icon.svg"
              alt="About Us"
              width={18}
              height={18}
              style={{ position: "relative", top: "1px" }}
            />
          </div>
          About Us
        </div>
      </a>
      <a
        href="#"
        className="block px-4 py-2 text-gray-700 hover:bg-[#ecdbdb] font-body text-base"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <Image
              src="/faq-icon.svg"
              alt="FAQ"
              width={22}
              height={22}
              style={{ position: "relative", top: "1px" }}
            />
          </div>
          FAQ
        </div>
      </a>
    </>
  );

  const partnershipLinks = (
    <>
      <a
        href="#"
        className="block px-4 py-2 text-gray-700 hover:bg-[#ecdbdb] font-body text-base"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <Image
              src="/medpart-icon.svg"
              alt="Media Partner"
              width={22}
              height={22}
              style={{ position: "relative", top: "1px" }}
            />
          </div>
          Media Partner
        </div>
      </a>
      <a
        href="#"
        className="block px-4 py-2 text-gray-700 hover:bg-[#ecdbdb] font-body text-base"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <Image
              src="/agency-icon.svg"
              alt="Agency"
              width={22}
              height={22}
              style={{ position: "relative", top: "1px" }}
            />
          </div>
          Agency
        </div>
      </a>
    </>
  );

  return (
    <header className="bg-[#FBEAEA] border-b border-gray-100" ref={navbarRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Mobile Play Button */}
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <Image
              src="/8eh.png"
              alt="8EH Logo"
              width={61}
              height={61}
              className="cursor-pointer"
              onClick={() => router.push("/")}
            />

            {/* Play button (mobile only) */}
            <button
              onClick={handlePlayClick}
              className="md:hidden bg-[#D83232] hover:bg-[#B72929] text-white px-3 py-2 rounded-full font-body font-medium transition-colors cursor-pointer flex items-center gap-2"
              style={{
                boxShadow: `
                  0 1px 2px rgba(2, 8, 11, 0.05),
                  inset 0 32px 24px rgba(255, 255, 255, 0.05),
                  inset 0 2px 1px rgba(255, 255, 255, 0.25),
                  inset 0 0px 0px rgba(2, 8, 11, 0.15),
                  inset 0 -2px 1px rgba(0, 0, 0, 0.20)
                `,
              }}
            >
              {isPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" fill="white" />
                  <rect
                    x="14"
                    y="5"
                    width="4"
                    height="14"
                    rx="1"
                    fill="white"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="white"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <polygon points="6,4 20,12 6,20" fill="white" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/"
              className="text-gray-900 hover:text-gray-600 font-body font-normal text-base"
            >
              Home
            </a>
            <a
              href="#"
              className="text-gray-900 hover:text-gray-600 font-body font-normal text-base"
            >
              Podcast
            </a>
            <a
              href="#"
              className="text-gray-900 hover:text-gray-600 font-body font-normal text-base"
            >
              Blog
            </a>

            {/* Discover Dropdown */}
            <div className="relative">
              <button
                onClick={() => handleDropdown("discover")}
                className="flex items-center text-gray-900 hover:text-gray-600 font-body font-normal text-base"
              >
                Discover
                <svg
                  className={`ml-1 h-4 w-4 transition-transform ${
                    openDropdown === "discover" ? "rotate-180" : ""
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
              {openDropdown === "discover" && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#FBEAEA] rounded-lg shadow-lg py-2 z-50">
                  {discoverLinks}
                </div>
              )}
            </div>

            {/* Partnership Dropdown */}
            <div className="relative">
              <button
                onClick={() => handleDropdown("partnership")}
                className="flex items-center text-gray-900 hover:text-gray-600 font-body font-normal text-base"
              >
                Partnership
                <svg
                  className={`ml-1 h-4 w-4 transition-transform ${
                    openDropdown === "partnership" ? "rotate-180" : ""
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
              {openDropdown === "partnership" && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#FBEAEA] rounded-lg shadow-lg py-2 z-50">
                  {partnershipLinks}
                </div>
              )}
            </div>
          </nav>

          {/* Custom Play Button (desktop/tablet) */}
          <button
            onClick={handlePlayClick}
            className="hidden md:flex bg-[#D83232] hover:bg-[#B72929] text-white px-4 py-2 rounded-full font-body font-medium transition-colors cursor-pointer items-center gap-2"
            style={{
              boxShadow: `
                0 1px 2px rgba(2, 8, 11, 0.05),
                inset 0 32px 24px rgba(255, 255, 255, 0.05),
                inset 0 2px 1px rgba(255, 255, 255, 0.25),
                inset 0 0px 0px rgba(2, 8, 11, 0.15),
                inset 0 -2px 1px rgba(0, 0, 0, 0.20)
              `,
            }}
          >
            {isPlaying ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" fill="white" />
                  <rect
                    x="14"
                    y="5"
                    width="4"
                    height="14"
                    rx="1"
                    fill="white"
                  />
                </svg>
                <span className="ml-1">Pause</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="white"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <polygon points="6,4 20,12 6,20" fill="white" />
                </svg>
                <span className="ml-1">Play</span>
              </>
            )}
          </button>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={handleMobileMenuToggle}
              className="text-gray-900 hover:text-red-500"
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#FBEAEA] border-t border-gray-200">
          <nav className="flex flex-col px-4 pt-2 pb-4">
            <a
              href="/"
              className="px-3 py-3 text-gray-900 rounded-md font-medium text-base font-body"
            >
              Home
            </a>
            <a
              href="#"
              className="px-3 py-3 text-gray-900 rounded-md font-medium text-base font-body"
            >
              Podcast
            </a>
            <a
              href="#"
              className="px-3 py-3 text-gray-900 rounded-md font-medium text-base font-body"
            >
              Blog
            </a>

            {/* Discover Dropdown for Mobile */}
            <div>
              <button
                onClick={() => handleDropdown("discover")}
                className="w-full flex justify-between items-center px-3 py-3 text-gray-900 rounded-md font-medium text-base text-left font-body"
              >
                <span>Discover</span>
                <svg
                  className={`h-5 w-5 transition-transform ${
                    openDropdown === "discover" ? "rotate-180" : ""
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
              {openDropdown === "discover" && (
                <div className="pl-4 mt-2 space-y-1">{discoverLinks}</div>
              )}
            </div>

            {/* Partnership Dropdown for Mobile */}
            <div>
              <button
                onClick={() => handleDropdown("partnership")}
                className="w-full flex justify-between items-center px-3 py-3 text-gray-900 rounded-md font-medium text-base text-left font-body"
              >
                <span>Partnership</span>
                <svg
                  className={`h-5 w-5 transition-transform ${
                    openDropdown === "partnership" ? "rotate-180" : ""
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
              {openDropdown === "partnership" && (
                <div className="pl-4 mt-2 space-y-1">{partnershipLinks}</div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
