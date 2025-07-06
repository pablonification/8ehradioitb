import { useState, useEffect, useCallback } from "react";

export const useRadioStream = () => {
  const [streamUrl, setStreamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Configuration for the streaming service
  const STREAM_CONFIG = {
    baseUrl: "https://uk22freenew.listen2myradio.com/live.mp3",
    fallbackUrl: "http://uk22freenew.listen2myradio.com:23981/",
    maxRetries: 3,
    retryDelay: 2000,
  };

  // Generate dynamic stream URL similar to embed player
  const generateStreamUrl = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000000);
    const sessionId = `s1_23981_stream_${random}`;

    // Add additional parameters that might be needed
    const params = new URLSearchParams({
      typeportmount: sessionId,
      t: timestamp.toString(),
      _: Math.random().toString(36).substr(2, 9), // Additional randomness
    });

    return `${STREAM_CONFIG.baseUrl}?${params.toString()}`;
  }, []);

  // Initialize stream URL
  useEffect(() => {
    const url = generateStreamUrl();
    setStreamUrl(url);
  }, [generateStreamUrl]);

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

  // Get stream URL with fresh session
  const getStreamUrl = useCallback(() => {
    return generateStreamUrl();
  }, [generateStreamUrl]);

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
