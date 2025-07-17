import React, { useState, useRef, useEffect } from "react";

const PodcastAudioPlayer = ({ audioUrl, title, image, subtitle, description, isPlaying, setIsPlaying }) => {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioUrl) {
      setShowPlayer(true);
      // Ketika audioUrl berubah, kita ingin memastikan audio siap diputar
      // Jika audioRef.current sudah ada, kita bisa langsung load ulang dan menunggu canplaythrough
      if (audioRef.current) {
        audioRef.current.load(); // Memuat ulang audio jika URL berubah
        setIsPlaying(false); // Pastikan status awal adalah pause
      }
    } else {
      setShowPlayer(false);
      setIsPlaying(false);
    }
  }, [audioUrl]);

  // Sinkronisasi: jika radio mulai play, matikan podcast
  useEffect(() => {
    const handleRadioPlay = () => {
      setIsPlaying(false);
      setShowPlayer(false);
    };
    window.addEventListener("radioPlayRequested", handleRadioPlay);
    return () => window.removeEventListener("radioPlayRequested", handleRadioPlay);
  }, []);

  // Saat podcast mulai play, broadcast event agar radio stop
  useEffect(() => {
    if (isPlaying) {
      window.dispatchEvent(new CustomEvent("podcastPlayRequested"));
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => {
    // Pengelolaan play/pause berdasarkan isPlaying state
    if (audioRef.current) {
      if (isPlaying) {
        // Kita hanya mencoba play jika audio sudah bisa diputar
        // Event onCanPlayThrough akan menangani pemutaran otomatis
        // agar tidak ada race condition saat pertama kali load
        if (audioRef.current.readyState >= 3) { // READYSTATE_HAVE_FUTURE_DATA (bisa diputar sedikit)
          audioRef.current.play().catch(error => {
            console.error("Error playing audio:", error);
            // Handle error (misal, user belum interaksi dengan halaman)
            // Mungkin tampilkan pesan "Klik play untuk memulai"
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]); // audioUrl tidak perlu lagi di sini karena di-handle oleh useEffect pertama

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
    if (muted && parseFloat(e.target.value) > 0) {
      setMuted(false);
    }
  };

  const toggleMute = () => {
    setMuted((prev) => !prev);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Callback ini akan dipanggil ketika browser menentukan bahwa audio bisa diputar tanpa buffering
  const handleCanPlayThrough = () => {
    if (isPlaying) { // Hanya play jika state isPlaying sudah true
      audioRef.current.play().catch(error => {
        console.error("Error playing audio after canplaythrough:", error);
      });
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!showPlayer) return null;

  return (
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
                src={image || "/8eh-real.svg"}
                alt="cover"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="text-sm min-w-0 w-48 md:w-60 flex-shrink-0 overflow-hidden">
              <p className="font-bold text-gray-800 truncate">{title}</p>
              {subtitle && <p className="text-gray-500 truncate">{subtitle}</p>}
              {description && <p className="text-gray-400 truncate max-w-xs hidden md:block">{description}</p>}
            </div>
          </div>

          {/* 2. Controls & Progress */}
          <div className="flex-1 flex flex-col items-center justify-center md:mx-2 min-w-0">
            <div className="flex items-center justify-center w-full gap-6">
              <button
                className="text-gray-500 hover:text-black disabled:opacity-40 text-xl"
                disabled // Tetap disabled jika belum ada fungsi prev/next
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
                disabled // Tetap disabled jika belum ada fungsi prev/next
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
              <span className="w-8 text-right flex-shrink-0">{formatTime(progress)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={handleSeek}
                className="flex-grow h-3 bg-gray-200 rounded-full min-w-0 accent-gray-500"
              />
              <span className="w-8 text-left flex-shrink-0">{formatTime(duration)}</span>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlayThrough={handleCanPlayThrough}
              onEnded={() => setIsPlaying(false)}
              style={{ display: "none" }}
            />
          </div>

          {/* 3. Volume */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0 w-32 justify-end">
            <button
              type="button"
              onClick={toggleMute}
              className="text-gray-600 hover:text-black focus:outline-none cursor-pointer"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                // Speaker slashed
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" alt="Mute">
                  <path d="M16.5 12a6.5 6.5 0 0 0-6.5-6.5v2A4.5 4.5 0 0 1 14.5 12h2z" fill="#d1d5db"/>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm16.5 3a6.5 6.5 0 0 0-6.5-6.5v2A4.5 4.5 0 0 1 17.5 12h2z"/>
                  <line x1="19" y1="5" x2="5" y2="19" stroke="#ef4444" strokeWidth="2" />
                </svg>
              ) : (
                // Speaker normal
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
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