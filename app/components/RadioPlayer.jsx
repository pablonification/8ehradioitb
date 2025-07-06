"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRadioStream } from "@/app/hooks/useRadioStream";

const RadioPlayer = ({ className = "", showTitle = true, compact = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isBuffering, setIsBuffering] = useState(false);
  const audioRef = useRef(null);
  const playPromiseRef = useRef(null);

  const {
    streamUrl,
    isLoading,
    error,
    retryCount,
    refreshStream,
    handleStreamError,
    getStreamUrl,
    setIsLoading,
    setError,
    attempt,
  } = useRadioStream();

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setIsBuffering(false);
      setError("");
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      setIsBuffering(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      // Notify other components about play state
      window.dispatchEvent(
        new CustomEvent("audioStateChanged", {
          detail: { isPlaying: true },
        }),
      );
    };

    const handlePause = () => {
      setIsPlaying(false);
      // Notify other components about pause state
      window.dispatchEvent(
        new CustomEvent("audioStateChanged", {
          detail: { isPlaying: false },
        }),
      );
    };

    const handleError = (e) => {
      console.error("Audio error event", e);
      console.info("Current audio.src:", audio.src);
      setIsPlaying(false);
      setIsBuffering(false);
      handleStreamError();
      // Notify other components about error state
      window.dispatchEvent(
        new CustomEvent("audioStateChanged", {
          detail: { isPlaying: false },
        }),
      );
    };

    const handleAbort = () => {
      setIsPlaying(false);
      setIsBuffering(false);
    };

    const handleStalled = () => {
      setIsBuffering(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Notify other components about end state
      window.dispatchEvent(
        new CustomEvent("audioStateChanged", {
          detail: { isPlaying: false },
        }),
      );
    };

    // Additional debug on loadedmetadata to confirm stream metadata
    const handleLoadedMetadata = () => {
      console.log("Audio loaded metadata. ReadyState:", audio.readyState);
    };

    // Add event listeners
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
    audio.addEventListener("abort", handleAbort);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("abort", handleAbort);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [handleStreamError]);

  // Listen for external play/pause triggers (from navbar)
  useEffect(() => {
    const handlePlayerControl = () => {
      if (isPlaying) {
        handlePause();
      } else {
        handlePlay();
      }
    };

    window.addEventListener("triggerPlayerControl", handlePlayerControl);

    return () => {
      window.removeEventListener("triggerPlayerControl", handlePlayerControl);
    };
  }, [isPlaying]);

  // Handle play with proper promise handling
  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      // Cancel any pending play promise
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }

      // Generate fresh stream URL for new play attempt
      const freshUrl = getStreamUrl();
      audio.src = freshUrl;

      // Ensure the browser starts loading the new source before attempting to play (helps on mobile/iOS)
      audio.load();

      setIsLoading(true);
      setError("");

      // Start playing
      playPromiseRef.current = audio.play();
      await playPromiseRef.current;

      setIsPlaying(true);
    } catch (playError) {
      console.error("Play error:", playError);
      setIsPlaying(false);
      setIsLoading(false);

      if (playError.name === "AbortError") {
        setError("Playback was interrupted. Please try again.");
      } else if (playError.name === "NotAllowedError") {
        setError(
          "Playback requires user interaction. Please click play again.",
        );
      } else {
        setError("Failed to start playback. Refreshing stream...");
        handleStreamError();
      }
    } finally {
      playPromiseRef.current = null;
    }
  };

  const handlePause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      // Wait for any pending play promise to resolve
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }

      audio.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error("Pause error:", error);
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      await handlePause();
    } else {
      await handlePlay();
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleRefresh = () => {
    console.log("[RadioPlayer] Manual refresh triggered");
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ""; // Clear source
    }
    // Reset attempts to start fresh
    refreshStream(false);
  };

  const getPlayButtonText = () => {
    if (isLoading || isBuffering) return "⏳";
    if (isPlaying) return "⏸️";
    return "▶️";
  };

  const getStatusText = () => {
    if (error) return error;
    if (isLoading) return "Loading stream...";
    if (isBuffering) return "Buffering...";
    if (isPlaying) return "Playing live stream";
    return "Ready to play";
  };

  if (compact) {
    return (
      <div
        className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 ${className}`}
      >
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={togglePlay}
            disabled={isLoading && !isBuffering}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 ${
              isPlaying
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } ${isBuffering ? "animate-pulse" : ""} disabled:bg-gray-500 disabled:cursor-not-allowed`}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <span className="text-lg">{getPlayButtonText()}</span>
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-white/90 text-sm font-medium truncate">
              {showTitle && "🔴 Live Stream - 8EH Radio ITB"}
            </div>
            <div
              className={`text-xs mt-1 ${error ? "text-red-200" : "text-white/70"}`}
            >
              {getStatusText()}
            </div>
            {/* Debug info */}
            <div className="text-[10px] text-white/50 mt-1 break-all">
              Attempt: {attempt} (
              {
                [
                  "Dynamic HTTPS",
                  "Static HTTPS",
                  "HTTP Fallback",
                  "HTTPS Alt Port",
                  "HTTP Alt Port",
                  "Proxy",
                ][attempt]
              }
              ) | Retry: {retryCount}
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-300"
            aria-label="Refresh stream"
          >
            <span className="text-sm">🔄</span>
          </button>
        </div>

        <audio
          ref={audioRef}
          src={streamUrl || undefined}
          volume={volume}
          preload="none"
          playsInline
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 ${className}`}
    >
      {showTitle && (
        <div className="text-center mb-4">
          <h3 className="text-white font-semibold text-lg">8EH Radio ITB</h3>
          <p className="text-white/80 text-sm">Live Stream</p>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={togglePlay}
          disabled={isLoading && !isBuffering}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold transition-all duration-300 shadow-lg ${
            isPlaying
              ? "bg-red-500 hover:bg-red-600 hover:scale-105"
              : "bg-green-500 hover:bg-green-600 hover:scale-105"
          } ${isBuffering ? "animate-pulse" : ""} disabled:bg-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100`}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {getPlayButtonText()}
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-white text-sm">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              aria-label="Volume control"
            />
            <span className="text-white/80 text-sm min-w-[40px]">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-300 hover:scale-105"
          aria-label="Refresh stream"
        >
          🔄
        </button>
      </div>

      <div className="text-center">
        <div className={`text-sm ${error ? "text-red-200" : "text-white/80"}`}>
          {getStatusText()}
        </div>
        {/* Debug info */}
        <div className="text-[10px] text-white/50 mt-1 break-all">
          Attempt: {attempt} (
          {
            [
              "Dynamic HTTPS",
              "Static HTTPS",
              "HTTP Fallback",
              "HTTPS Alt Port",
              "HTTP Alt Port",
              "Proxy",
            ][attempt]
          }
          ) | Retry: {retryCount}
          <br />
          URL: {streamUrl}
        </div>
        {retryCount > 0 && (
          <div className="text-white/60 text-xs mt-1">
            Retry attempt: {retryCount}
          </div>
        )}
      </div>

      <audio
        ref={audioRef}
        src={streamUrl || undefined}
        volume={volume}
        preload="none"
        playsInline
      />
    </div>
  );
};

export default RadioPlayer;
