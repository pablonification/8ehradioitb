"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

/**
 * GlobalAudioPlayer
 * ------------------
 * A fixed player bar that stays at the top of the page while audio is playing.
 * It closely replicates the design shown in the provided screenshot:
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ ▢  Episode 1 …   ────────────────⏮ ⏯ ⏭──────  🔊 ───────      │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Behaviour:
 * 1. The bar is only visible while the stream is playing / loading / buffering.
 * 2. Uses the existing `useRadioStream` hook for fetching + retry logic.
 * 3. Dispatches a `window` custom-event  `audioStateChanged` so other
 *    components (e.g. the Navbar mobile play button) stay in sync.
 */
const GlobalAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  // Player config state
  const [playerConfig, setPlayerConfig] = useState({ title: "", subtitle: "", coverImage: "" });

  useEffect(() => {
    // Fetch player config from API
    fetch("/api/player-config")
      .then((res) => res.json())
      .then((data) => {
        setPlayerConfig({
          title: data?.title || "",
          subtitle: data?.subtitle || "",
          coverImage: data?.coverImage || "",
        });
      })
      .catch(() => {
        setPlayerConfig({ title: "", subtitle: "", coverImage: "" });
      });
  }, []);

  /* Listen to global play-state changes */
  useEffect(() => {
    const handler = (e) => {
      const playing = e.detail.isPlaying;
      setIsPlaying(playing);
      if (playing) setShowPlayer(true); // show after first play
    };

    window.addEventListener("audioStateChanged", handler);
    // Sinkronisasi: jika podcast mulai play, matikan radio
    const handlePodcastPlay = () => {
      setIsPlaying(false);
      setShowPlayer(false);
      window.dispatchEvent(new CustomEvent("pauseRequested"));
    };
    window.addEventListener("podcastPlayRequested", handlePodcastPlay);
    return () => {
      window.removeEventListener("audioStateChanged", handler);
      window.removeEventListener("podcastPlayRequested", handlePodcastPlay);
    };
  }, []);

  // Saat radio mulai play, broadcast event agar podcast stop
  useEffect(() => {
    if (isPlaying) {
      window.dispatchEvent(new CustomEvent("radioPlayRequested"));
    }
  }, [isPlaying]);

  /* --------------------------------------------------------------------- */
  /*                          Event Handlers                               */
  /* --------------------------------------------------------------------- */
  /* --------------------------------------------------------------------- */
  /*                               Handlers                                */
  const togglePlay = () => {
    if (isPlaying) {
      window.dispatchEvent(new CustomEvent("pauseRequested"));
    } else {
      window.dispatchEvent(new CustomEvent("playRequested"));
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    window.dispatchEvent(
      new CustomEvent("volumeChanged", { detail: { volume: newVol } }),
    );
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(1);
      window.dispatchEvent(
        new CustomEvent("volumeChanged", { detail: { volume: 1 } }),
      );
    } else {
      setIsMuted(true);
      setVolume(0);
      window.dispatchEvent(
        new CustomEvent("volumeChanged", { detail: { volume: 0 } }),
      );
    }
  };

  const handleRefresh = () => {
    // For future: maybe request new stream, but left empty
  };

  /* --------------------------------------------------------------------- */
  /*                           Derived Helpers                             */
  /* --------------------------------------------------------------------- */
  const getPlayIcon = () => (isPlaying ? "⏸" : "▶");

  const isVisible = showPlayer;

  /* --------------------------------------------------------------------- */
  /*                               Render                                  */
  /* --------------------------------------------------------------------- */
  return (
    <>
      {isVisible && (
        <>
          {/* Progressive blur background layer */}
          <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/15 to-transparent backdrop-blur-xs z-40 pointer-events-none" />

          {/* Player UI layer */}
          <div className="fixed bottom-0 left-0 right-0 z-50 p-2 md:p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-full mx-auto p-3 flex flex-col md:flex-row items-center gap-3 md:gap-4 border border-gray-200/80">
              {/* 1. Album Art + Song Info */}
              <div className="flex items-center gap-3 w-full md:w-auto md:flex-shrink-0">
                <div className="w-14 h-14 bg-gray-200 rounded-md relative overflow-hidden shadow-sm flex-shrink-0">
                  <img
                    src={playerConfig.coverImage || "/8eh.png"}
                    alt="cover"
                    className="object-cover w-full h-full absolute inset-0"
                  />
                </div>
                <div className="text-sm min-w-0 w-48 md:w-60 flex-shrink-0">
                  <p className="font-bold text-gray-800 truncate font-body">
                    {playerConfig.title || "8EH Radio ITB"}
                  </p>
                  <p className="text-gray-500 flex items-center gap-2 font-body">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Live Now
                  </p>
                </div>
              </div>

              {/* 2. Controls & Progress */}
              <div className="flex-1 flex flex-col items-center justify-center md:mx-2 min-w-0">
                <div className="flex items-center justify-center w-full gap-6">
                  <button
                    className="text-gray-500 hover:text-black disabled:opacity-40 text-xl"
                    disabled
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 md:w-10 md:h-10 rounded-full ring-1 ring-gray-300 hover:ring-gray-900 text-gray-800 flex items-center justify-center text-xl transition-all"
                  >
                    {isPlaying ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 md:w-5 md:h-5"
                      >
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 md:w-5 md:h-5 ml-1 md:ml-0.5"
                      >
                        <path d="M8 5v14l11-7z"></path>
                      </svg>
                    )}
                  </button>
                  <button
                    className="text-gray-500 hover:text-black disabled:opacity-40 text-xl"
                    disabled
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path>
                    </svg>
                  </button>
                </div>
                {/* Progress bar row with fixed duration width */}
                <div className="w-full flex items-center gap-2 text-[10px] text-gray-500 mt-2 min-w-0">
                  <span className="w-8 text-right flex-shrink-0">0:00</span>
                  <div className="flex-grow h-1 bg-gray-200 rounded-full relative min-w-0">
                    <div
                      className="absolute h-full bg-gray-800 rounded-full"
                      style={{ width: "0%" }}
                    />
                  </div>
                  <span className="w-8 text-left flex-shrink-0">0:00</span>
                </div>
              </div>

              {/* 3. Volume */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0 w-32 justify-end">
                <button type="button" onClick={handleMuteToggle} className="text-gray-600 focus:outline-none cursor-pointer">
                  {isMuted || volume === 0 ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" alt="Mute">
                      <path d="M16.5 12a6.5 6.5 0 0 0-6.5-6.5v2A4.5 4.5 0 0 1 14.5 12h2z" fill="#d1d5db"/>
                      <path d="M3 9v6h4l5 5V4L7 9H3zm16.5 3a6.5 6.5 0 0 0-6.5-6.5v2A4.5 4.5 0 0 1 17.5 12h2z"/>
                      <line x1="19" y1="5" x2="5" y2="19" stroke="#ef4444" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" alt="Unmute">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 md:w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GlobalAudioPlayer;
