"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRadioStream } from "@/app/hooks/useRadioStream";

export default function Navbar() {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);
  const navbarRef = useRef(null);
  const [onAir, setOnAir] = useState(false);
  const [playerTitle, setPlayerTitle] = useState("");

  /* ------------------------------------------------------------- */
  /* Radio stream (moved from GlobalAudioPlayer)                   */
  /* ------------------------------------------------------------- */
  const {
    streamUrl,
    isLoading,
    error,
    refreshStream,
    handleStreamError,
    getStreamUrl,
    setIsLoading,
    setError,
  } = useRadioStream();

  /* ------------------------------------------------------------- */
  /* Helper to emit play state to other components                 */
  /* ------------------------------------------------------------- */
  const emitAudioStateChanged = useCallback((playing) => {
    window.dispatchEvent(
      new CustomEvent("audioStateChanged", {
        detail: { isPlaying: playing },
      }),
    );
  }, []);

  /* ------------------------------------------------------------- */
  /* Core playback actions                                         */
  /* ------------------------------------------------------------- */
  const playStream = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const freshUrl = getStreamUrl();
      // Hanya set src jika berbeda
      if (audio.src !== freshUrl) {
        audio.src = freshUrl;
        audio.load();
      }
      setIsLoading(true);
      await audio.play();
      audio.volume = volume;
      setIsPlaying(true);
      setIsLoading(false);
      emitAudioStateChanged(true);
    } catch (err) {
      console.error("Navbar play error", err);
      setIsPlaying(false);
      setIsLoading(false);
      handleStreamError();
    }
  }, [
    getStreamUrl,
    volume,
    emitAudioStateChanged,
    handleStreamError,
    setIsLoading,
  ]);

  const pauseStream = useCallback(() => {
    console.log("pauseStream");
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    // Reset source to fully stop streaming and avoid overlapping audio
    audio.removeAttribute("src");
    audio.load();
    setIsPlaying(false);
    emitAudioStateChanged(false);
  }, [emitAudioStateChanged]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseStream();
      console.log("Paused");
    } else {
      playStream();
      console.log("Played");
    }
  }, [isPlaying, playStream, pauseStream]);

  /* ------------------------------------------------------------- */
  /* External events from GlobalAudioPlayer                        */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    const handlePlayReq = () => {
      if (!isPlaying) playStream();
    };

    const handlePauseReq = () => {
      if (isPlaying) pauseStream();
    };

    const handleVolumeChanged = (e) => {
      const newVol = e.detail.volume;
      setVolume(newVol);
      if (audioRef.current) audioRef.current.volume = newVol;
    };

    window.addEventListener("playRequested", handlePlayReq);
    window.addEventListener("pauseRequested", handlePauseReq);
    window.addEventListener("volumeChanged", handleVolumeChanged);

    return () => {
      window.removeEventListener("playRequested", handlePlayReq);
      window.removeEventListener("pauseRequested", handlePauseReq);
      window.removeEventListener("volumeChanged", handleVolumeChanged);
    };
  }, [isPlaying, playStream, pauseStream]);

  /* ------------------------------------------------------------- */
  /* Sync internal audio element events (optional future)          */
  /* ------------------------------------------------------------- */
  // could add listeners for ended/stalled etc if needed

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
    fetch("/api/stream-config")
      .then((res) => res.json())
      .then((data) => setOnAir(typeof data?.onAir === "boolean" ? data.onAir : true));
  }, []);

  useEffect(() => {
    fetch("/api/player-config")
      .then((res) => res.json())
      .then((data) => setPlayerTitle(data?.title || ""));
  }, []);

  const handlePlayClick = () => {
    if (onAir) togglePlay();
  };

  const discoverLinks = (
    <>
      <a
        href="/programs"
        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-body text-base"
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
        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-body text-base"
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
        href="/faq"
        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-body text-base"
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
        href="/media-partner"
        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-body text-base"
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
        href="/agency"
        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-body text-base"
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
    <header className="bg-white border-b border-gray-100" ref={navbarRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Mobile Play Button + On Air Mobile */}
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
              className={`md:hidden px-3 py-2 rounded-full font-body font-medium transition-colors cursor-pointer flex items-center gap-2 ${onAir ? "bg-[#D83232] hover:bg-[#B72929] text-white cursor-pointer" : "bg-gray-300 text-white cursor-not-allowed"}`}
              disabled={!onAir}
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

            {/* On Air indicator (visible on mobile alongside play button, and on desktop with logo) */}
            {onAir && (
              <span className="flex items-center gap-1 font-body">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-red-600 text-sm font-semibold ml-1">
                  On Air
                </span>
                {/* {playerTitle && (
                  <span className="font-base text-sm text-gray-900">
                    {playerTitle}
                  </span>
                )} */}
              </span>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/"
              className="text-gray-900 hover:text-[#D83232] font-body font-normal text-base transition-colors"
            >
              Home
            </a>
            <a
              href="/podcast"
              className="text-gray-900 hover:text-[#D83232] font-body font-normal text-base transition-colors"
            >
              Podcast
            </a>
            <a
              href="/blog"
              className="text-gray-900 hover:text-[#D83232] font-body font-normal text-base transition-colors"
            >
              Blog
            </a>

            {/* Discover Dropdown */}
            <div className="relative">
              <button
                onClick={() => handleDropdown("discover")}
                className="flex items-center text-gray-900 hover:text-[#D83232] font-body font-normal text-base transition-colors"
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
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  {discoverLinks}
                </div>
              )}
            </div>

            {/* Partnership Dropdown */}
            <div className="relative">
              <button
                onClick={() => handleDropdown("partnership")}
                className="flex items-center text-gray-900 hover:text-[#D83232] font-body font-normal text-base transition-colors"
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
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  {partnershipLinks}
                </div>
              )}
            </div>
          </nav>

          {/* Custom Play Button (desktop/tablet) */}
          <button
            onClick={handlePlayClick}
            className={`hidden md:flex px-4 py-2 rounded-full font-body font-medium transition-colors items-center gap-2 ${onAir ? "bg-[#D83232] hover:bg-[#B72929] text-white cursor-pointer" : "bg-gray-300 text-white cursor-not-allowed"}`}
            disabled={!onAir}
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
              className="text-gray-900 hover:text-[#D83232] transition-colors"
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
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="flex flex-col px-4 pt-2 pb-4">
            <a
              href="/"
              className="px-3 py-3 text-gray-900 hover:text-[#D83232] hover:bg-gray-100 rounded-md font-medium text-base font-body transition-colors"
            >
              Home
            </a>
            <a
              href="/podcast"
              className="px-3 py-3 text-gray-900 hover:text-[#D83232] hover:bg-gray-100 rounded-md font-medium text-base font-body transition-colors"
            >
              Podcast
            </a>
            <a
              href="/blog"
              className="px-3 py-3 text-gray-900 hover:text-[#D83232] hover:bg-gray-100 rounded-md font-medium text-base font-body transition-colors"
            >
              Blog
            </a>

            {/* Discover Dropdown for Mobile */}
            <div>
              <button
                onClick={() => handleDropdown("discover")}
                className="w-full flex justify-between items-center px-3 py-3 text-gray-900 hover:text-[#D83232] hover:bg-gray-100 rounded-md font-medium text-base text-left font-body transition-colors"
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
                className="w-full flex justify-between items-center px-3 py-3 text-gray-900 hover:text-[#D83232] hover:bg-gray-100 rounded-md font-medium text-base text-left font-body transition-colors"
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

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={streamUrl || undefined}
        preload="none"
        playsInline
      />
    </header>
  );
}