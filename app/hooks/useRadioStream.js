import { useState, useEffect, useCallback } from "react";

export const useRadioStream = () => {
  const [streamUrl, setStreamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Configuration for the streaming service
  const STREAM_CONFIG = {
    // Base URL for the Free-Shoutcast stream (without the random query segment)
    baseUrl: "https://s2.free-shoutcast.com/stream/18068/;stream.mp3",
    // Fallback URL (static) – used after the first failure
    fallbackUrl: "https://s2.free-shoutcast.com/stream/18068/;stream.mp3",
    maxRetries: 3,
    retryDelay: 2000,
  };

  // Generate dynamic stream URL similar to embed player
  const generateStreamUrl = useCallback(() => {
    // Generate a 6-character alphanumeric code (letters & digits)
    const randomCode = Math.random().toString(36).substring(2, 8);
    return `${STREAM_CONFIG.baseUrl}?${randomCode}`;
  }, []);

  // Detect if running on an iOS device (iPhone, iPod, iPad)
  const isIOS =
    typeof window !== "undefined" &&
    /iP(hone|od|ad)/i.test(window.navigator.userAgent);

  // Initialize stream URL
  useEffect(() => {
    const url = isIOS ? "/api/stream" : generateStreamUrl();
    setStreamUrl(url);
  }, [generateStreamUrl, isIOS]);

  // Refresh stream URL
  const refreshStream = useCallback(() => {
    setError("");
    setRetryCount(0);
    const newUrl = generateStreamUrl();
    setStreamUrl(newUrl);
    return newUrl;
  }, [generateStreamUrl]);

  // Handle stream errors with fallback logic
  const handleStreamError = useCallback(() => {
    setIsLoading(false);

    // Try the fallback URL once on the very first failure (helps with Safari / CORS issues)
    if (retryCount === 0) {
      setError("Primary connection failed. Switching to fallback stream...");
      setRetryCount((prev) => prev + 1);
      setStreamUrl(STREAM_CONFIG.fallbackUrl);
      return;
    }

    if (retryCount < STREAM_CONFIG.maxRetries) {
      setError(
        `Connection failed. Retrying... (${retryCount + 1}/${STREAM_CONFIG.maxRetries})`,
      );

      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        const newUrl = generateStreamUrl();
        setStreamUrl(newUrl);
      }, STREAM_CONFIG.retryDelay);
    } else {
      setError("Unable to connect to the radio stream. Please try refreshing.");
    }
  }, [retryCount, generateStreamUrl]);

  // Get stream URL with fresh session (use fallback for iOS)
  const getStreamUrl = useCallback(() => {
    return isIOS ? "/api/stream" : generateStreamUrl();
  }, [isIOS, generateStreamUrl]);

  return {
    streamUrl,
    isLoading,
    error,
    retryCount,
    refreshStream,
    handleStreamError,
    getStreamUrl,
    setIsLoading,
    setError,
  };
};
