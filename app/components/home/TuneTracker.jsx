"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export default function TuneTracker({ tunes = [] }) {
  const [nowPlaying, setNowPlaying] = useState(null);
  const audioRef = useRef(null);

  // Fill array to ensure 10 items
  const filledTunes = Array.from({ length: 10 }, (_, i) => {
    // If the passed tunes array has gaps or isn't sorted 1-10 perfectly, we handle it here
    // But ideally server passes sorted top 10.
    // We'll trust the passed index if available, or just map linearly.
    const tune = tunes[i];
    return (
      tune || {
        order: i + 1,
        title: "",
        artist: "",
        coverImage: "/music-1.png",
        audioUrl: "",
      }
    );
  });

  const handlePlay = (idx) => {
    if (nowPlaying === idx) {
      audioRef.current.pause();
      setNowPlaying(null);
    } else {
      setNowPlaying(idx);
      if (filledTunes[idx].audioUrl) {
        audioRef.current.src = `/api/proxy-audio?key=${encodeURIComponent(filledTunes[idx].audioUrl)}`;
        audioRef.current.play();
      }
    }
  };

  return (
    <section className="relative py-24 bg-white text-gray-900 overflow-hidden">
      <audio ref={audioRef} onEnded={() => setNowPlaying(null)} />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px]">
        <Image
          src="/tune-tracker.png"
          alt="Decorative turntable"
          width={900}
          height={900}
          className="w-full h-full object-contain opacity-70 mix-blend-multiply"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <h2 className="font-accent text-6xl font-bold text-gray-900 mb-2">
            Tune Tracker
          </h2>
          <p className="font-body text-gray-600 text-lg">
            Discover the Hottest Tracks: Our Top 10 Music Charts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {filledTunes.map((tune, idx) => {
            const isPlaying = nowPlaying === idx;
            return (
              <div
                key={idx}
                className="flex items-center p-3 rounded-2xl bg-white/70 border border-gray-200/80 backdrop-blur-md hover:bg-gray-50/80 hover:border-gray-300 transition-all duration-300 shadow-sm"
              >
                <div className="w-8 text-center text-gray-400 font-mono font-medium">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="w-14 h-14 relative mx-4 rounded-full overflow-hidden flex-shrink-0 shadow-inner">
                  <img
                    src={
                      tune.coverImage
                        ? `/api/proxy-audio?key=${encodeURIComponent(tune.coverImage)}`
                        : "/8eh-real.svg"
                    }
                    alt={tune.title || `Song ${idx + 1}`}
                    className={`object-cover w-full h-full absolute inset-0 ${isPlaying ? "animate-[spin_3s_linear_infinite]" : ""}`}
                    style={{ position: "absolute", inset: 0 }}
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="font-heading font-bold text-gray-800">
                    {tune.title || (
                      <span className="italic text-gray-400">Coming Soon</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {tune.artist || (
                      <span className="italic text-gray-300">Coming Soon</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handlePlay(idx)}
                  className="w-12 h-12 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0 border border-gray-200/90 shadow-md cursor-pointer disabled:opacity-40"
                  aria-label={`Play ${tune.title}`}
                  disabled={!tune.audioUrl}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-gray-700"
                    fill="currentColor"
                  >
                    {isPlaying ? (
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    ) : (
                      <path d="M8 5v14l11-7z" />
                    )}
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
