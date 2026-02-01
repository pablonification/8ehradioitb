"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function TuneTracker({ tunes = [] }) {
  const [nowPlaying, setNowPlaying] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    fetch("/api/tune-tracker/meta")
      .then((res) => res.json())
      .then((data) => setMeta(data))
      .catch((err) => console.error("Failed to load meta", err))
      .finally(() => setLoadingMeta(false));
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (
      playerRef.current &&
      typeof playerRef.current.stopVideo === "function"
    ) {
      playerRef.current.stopVideo();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handlePlay = (idx) => {
    const tune = filledTunes[idx];

    if (nowPlaying === idx) {
      stopPlayback();
      setNowPlaying(null);
      return;
    }

    stopPlayback();
    setNowPlaying(idx);

    const isYouTube = tune.youtubeVideoId || tune.sourceType === "YOUTUBE";

    if (isYouTube && tune.youtubeVideoId) {
      if (!window.YT || !window.YT.Player) {
        console.error("YouTube API not loaded");
        return;
      }

      const start = tune.startSeconds || 0;
      const end = tune.endSeconds;

      const onStateChange = (event) => {
        if (event.data === window.YT.PlayerState.ENDED) {
          setNowPlaying(null);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
        if (event.data === window.YT.PlayerState.PLAYING) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => {
            if (!playerRef.current || !playerRef.current.getCurrentTime) return;
            const curr = playerRef.current.getCurrentTime();

            if (end && curr >= end) {
              playerRef.current.stopVideo();
              setNowPlaying(null);
              clearInterval(intervalRef.current);
            }

            if (curr < start) {
              playerRef.current.seekTo(start);
            }
          }, 1000);
        }
      };

      if (!playerRef.current) {
        playerRef.current = new window.YT.Player("youtube-player-hidden", {
          height: "0",
          width: "0",
          videoId: tune.youtubeVideoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            start: start,
            end: end,
            autoplay: 1,
          },
          events: {
            onStateChange: onStateChange,
            onError: () => {
              console.error("YouTube Player Error");
              setNowPlaying(null);
            },
          },
        });
      } else {
        playerRef.current.loadVideoById({
          videoId: tune.youtubeVideoId,
          startSeconds: start,
          endSeconds: end,
        });
      }
    } else if (tune.audioUrl) {
      if (audioRef.current) {
        audioRef.current.src = `/api/proxy-audio?key=${encodeURIComponent(
          tune.audioUrl,
        )}`;
        audioRef.current.play().catch((e) => {
          console.error("Audio playback failed", e);
          setNowPlaying(null);
        });
      }
    } else {
      setNowPlaying(null);
    }
  };

  const getCoverImageUrl = (coverImage) => {
    if (!coverImage) return "/8eh-real.svg";
    if (coverImage.startsWith("http") || coverImage.startsWith("/")) {
      return coverImage;
    }
    return `/api/proxy-audio?key=${encodeURIComponent(coverImage)}`;
  };

  const curatedBy = meta?.curatedBy;
  const monthYear = meta?.editionDate
    ? new Date(meta.editionDate).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <section className="relative py-24 bg-white text-gray-900 overflow-hidden">
      <audio ref={audioRef} onEnded={() => setNowPlaying(null)} />
      <div id="youtube-player-hidden" className="hidden"></div>

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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
          <div className="max-w-3xl">
            <h2 className="font-accent text-6xl font-bold text-gray-900 mb-2">
              Tune Tracker
            </h2>
            <p className="font-body text-gray-600 text-lg">
              Discover the Hottest Tracks: Our Top 10 Music Charts
            </p>
          </div>

          {loadingMeta ? (
            <div className="flex flex-col items-end gap-1 w-48">
              <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
            </div>
          ) : (
            (curatedBy || monthYear) && (
              <div className="text-right flex flex-col gap-1 md:pb-1">
                {curatedBy && (
                  <div className="text-sm text-gray-500 font-body">
                    Curated by{" "}
                    <span className="font-semibold text-gray-900">
                      {curatedBy}
                    </span>
                  </div>
                )}
                {monthYear && (
                  <div className="flex items-center justify-end">
                    <p className="font-heading text-gray-400 text-xs tracking-widest uppercase font-semibold">
                      {monthYear} EDITION
                    </p>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {filledTunes.map((tune, idx) => {
            const isPlaying = nowPlaying === idx;
            const canPlay =
              tune.audioUrl ||
              tune.youtubeVideoId ||
              tune.sourceType === "YOUTUBE";

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
                    src={getCoverImageUrl(tune.coverImage)}
                    alt={tune.title || `Song ${idx + 1}`}
                    className={`object-cover w-full h-full absolute inset-0 ${
                      isPlaying ? "animate-[spin_3s_linear_infinite]" : ""
                    }`}
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
                  disabled={!canPlay}
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
