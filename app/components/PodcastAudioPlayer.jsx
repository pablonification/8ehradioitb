import React, { useState, useEffect, useRef } from "react";
import { useGlobalAudio } from "@/app/hooks/useGlobalAudio"; // Import hook yang baru kita buat

const PodcastAudioPlayer = ({
  audioUrl,
  title,
  image,
  subtitle,
  description,
  isPlaying,
  setIsPlaying,
}) => {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);

  // Gunakan hook untuk mendapatkan referensi audio yang terjamin ada
  const audioRef = useGlobalAudio();
  // Use a ref to track external pause
  const externalPauseRef = useRef(false);

  // Efek utama untuk mengontrol audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioUrl) {
      setShowPlayer(true);
      const fullUrl = audioUrl.startsWith("/")
        ? audioUrl
        : `/api/proxy-audio?key=${encodeURIComponent(audioUrl)}`;

      if (audio.src !== window.location.origin + fullUrl) {
        audio.src = fullUrl;
        audio.load();
      }

      if (isPlaying) {
        audio.play().catch((e) => {
          console.error("Audio play error:", e);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
    } else {
      setShowPlayer(false);
      setIsPlaying(false);
    }
  }, [audioUrl, isPlaying, audioRef, setIsPlaying]);

  // Efek untuk sinkronisasi dengan radio dan update UI
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Pause podcast if radio starts
    const handleRadioPlay = () => {
      setIsPlaying(false);
      externalPauseRef.current = true;
    };
    window.addEventListener("radioPlayRequested", handleRadioPlay);

    // When podcast starts playing, pause radio
    if (isPlaying) {
      window.dispatchEvent(new CustomEvent("podcastPlayRequested"));
    }

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      window.removeEventListener("radioPlayRequested", handleRadioPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [audioRef, setIsPlaying, isPlaying]);

  // Separate effect for handling audio ended with current repeat state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch((e) => {
          console.error("Audio repeat play error:", e);
          setIsPlaying(false);
        });
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef, isRepeat, setIsPlaying]);

  // This effect must be at the top level, not inside another useEffect
  useEffect(() => {
    // Only hide player if pause was external (radio play)
    if (!isPlaying && externalPauseRef.current) {
      setShowPlayer(false);
      externalPauseRef.current = false;
    }
    // If pause was user-initiated, keep player visible
  }, [isPlaying]);

  // Efek untuk volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = muted ? 0 : volume;
    }
  }, [volume, muted, audioRef]);

  const togglePlay = () => setIsPlaying((p) => !p);
  const handleVolumeChange = (e) => setVolume(parseFloat(e.target.value));
  const toggleMute = () => setMuted((p) => !p);
  const handleSeek = (e) => {
    if (audioRef.current)
      audioRef.current.currentTime = parseFloat(e.target.value);
  };
  
  // Skip functionality
  const skipBackward = () => {
    if (audioRef.current) {
      const newTime = Math.max(0, audioRef.current.currentTime - 10);
      audioRef.current.currentTime = newTime;
    }
  };
  
  const skipForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
      audioRef.current.currentTime = newTime;
    }
  };
  
  const toggleRepeat = () => setIsRepeat((r) => !r);
  
  const formatTime = (sec) => {
    if (isNaN(sec) || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!showPlayer) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white shadow-2xl max-w-full mx-auto px-2 md:px-6 lg:px-60 py-1 md:py-2 flex flex-col md:flex-row items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto md:flex-shrink-0">
            {/* Play button moved here for mobile */}
            <button
              onClick={togglePlay}
              className="md:hidden w-8 h-8 rounded-full ring-1 ring-gray-300 hover:ring-gray-900 text-gray-800 flex items-center justify-center text-xl transition-all flex-shrink-0"
            >
              {isPlaying ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M8 5v14l11-7z"></path>
                </svg>
              )}
            </button>
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gray-200 rounded-md relative overflow-hidden shadow-sm flex-shrink-0">
              <img
                src={image || "/8eh-real.svg"}
                alt="cover"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="text-sm min-w-0 w-48 md:w-60 flex-shrink-0 overflow-hidden">
              <p className="font-bold text-gray-800 truncate text-xs md:text-sm">{title}</p>
              {subtitle && <p className="text-gray-500 truncate text-xs md:text-sm">{subtitle}</p>}
              {description && (
                <p className="text-gray-400 truncate max-w-xs hidden md:block">
                  {description}
                </p>
              )}
            </div>
          </div>
          {/* Controls & Progress - Desktop only */}
          <div className="hidden md:flex flex-1 flex-col items-center justify-center mx-2 min-w-0">
            <div className="flex items-center justify-center w-full gap-6">
              <button
                onClick={skipBackward}
                className="text-gray-500 hover:text-black disabled:opacity-40 text-xl transition-all duration-200 hover:scale-110"
                title="Skip backward 10 seconds"
              >
                <img
                  src="/fb.svg"
                  alt="Skip backward"
                  className="w-5 h-5"
                />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full ring-1 ring-gray-300 hover:ring-gray-900 text-gray-800 flex items-center justify-center text-xl transition-all"
              >
                {isPlaying ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M8 5v14l11-7z"></path>
                  </svg>
                )}
              </button>
              <button
                onClick={skipForward}
                className="text-gray-500 hover:text-black disabled:opacity-40 text-xl transition-all duration-200 hover:scale-110"
                title="Skip forward 10 seconds"
              >
                <img
                  src="/ff.svg"
                  alt="Skip forward"
                  className="w-5 h-5"
                />
              </button>
              <button
                onClick={toggleRepeat}
                className={`text-xl transition-colors ${
                  isRepeat 
                    ? "text-blue-600 hover:text-blue-700" 
                    : "text-gray-500 hover:text-black"
                }`}
                title={isRepeat ? "Repeat: On" : "Repeat: Off"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                </svg>
              </button>
            </div>
            <div className="w-full flex items-center gap-2 text-[10px] text-gray-500 mt-2 min-w-0">
              <span className="w-8 text-right flex-shrink-0">
                {formatTime(progress)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={handleSeek}
                className="flex-grow h-3 bg-gray-200 rounded-full relative min-w-0"
              />
              <span className="w-8 text-left flex-shrink-0">
                {formatTime(duration)}
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 flex-shrink-0 w-32 justify-end">
            <button
              type="button"
              onClick={toggleMute}
              className="text-gray-600 hover:text-black focus:outline-none cursor-pointer"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                  alt="Mute"
                >
                  <path
                    d="M16.5 12a6.5 6.5 0 0 0-6.5-6.5v2A4.5 4.5 0 0 1 14.5 12h2z"
                    fill="#d1d5db"
                  />
                  <path d="M3 9v6h4l5 5V4L7 9H3zm16.5 3a6.5 6.5 0 0 0-6.5-6.5v2A4.5 4.5 0 0 1 17.5 12h2z" />
                  <line
                    x1="19"
                    y1="5"
                    x2="5"
                    y2="19"
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 md:w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PodcastAudioPlayer;
