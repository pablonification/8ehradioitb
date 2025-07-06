import { useState, useEffect, useCallback } from "react";

export const useRadioStream = () => {
  const [streamUrl, setStreamUrl] = useState("");
  const [attempt, setAttempt] = useState(0); // 0: dynamic https, 1: static https, 2: proxy API
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Configuration for the streaming service
  const STREAM_CONFIG = {
    baseUrl: "https://uk25freenew.listen2myradio.com/live.mp3",
    fallbackUrl: "http://uk25freenew.listen2myradio.com:32559/",
    maxRetries: 3,
    retryDelay: 2000,
  };

  // Generate dynamic stream URL similar to embed player
  const generateStreamUrl = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000000);
    const sessionId = `s1_32559_stream_${random}`;

    // Add additional parameters that might be needed
    const params = new URLSearchParams({
      typeportmount: sessionId,
      t: timestamp.toString(),
      _: Math.random().toString(36).substr(2, 9), // Additional randomness
    });

    return `${STREAM_CONFIG.baseUrl}?${params.toString()}`;
  }, []);

  // Generate candidate URLs based on attempt index
  const getCandidateUrl = useCallback(
    (idx) => {
      switch (idx) {
        case 0:
          return generateStreamUrl();
        case 1:
          return "https://uk25freenew.listen2myradio.com/live.mp3";
        default:
          return "/api/stream";
      }
    },
    [generateStreamUrl],
  );

  // Initialize stream URL (use direct URL for all devices)
  useEffect(() => {
    const initialUrl = getCandidateUrl(0);
    console.log("[RadioStream] Initial stream URL (attempt 0):", initialUrl);
    setStreamUrl(initialUrl);
  }, [getCandidateUrl]);

  // Refresh stream URL
  const refreshStream = useCallback(
    (advance = false) => {
      setError("");
      setRetryCount(0);
      setAttempt((prev) => {
        const next = advance ? Math.min(prev + 1, 2) : prev;
        const newUrl = getCandidateUrl(next);
        console.log(
          `[RadioStream] Refreshing stream URL (attempt ${next}):`,
          newUrl,
        );
        setStreamUrl(newUrl);
        return next;
      });
    },
    [getCandidateUrl],
  );

  // Handle stream errors with fallback logic
  const handleStreamError = useCallback(() => {
    console.error("[RadioStream] Stream error encountered");
    setIsLoading(false);

    // Try the fallback URL once on the very first failure (helps with Safari / CORS issues)
    if (retryCount === 0) {
      setError("Primary connection failed. Switching to fallback stream...");
      setRetryCount((prev) => prev + 1);
      refreshStream(true);
      return;
    }

    if (retryCount < STREAM_CONFIG.maxRetries) {
      setError(
        `Connection failed. Retrying... (${retryCount + 1}/${STREAM_CONFIG.maxRetries})`,
      );

      setTimeout(() => {
        const newUrl = generateStreamUrl();
        console.log(
          "[RadioStream] Retry same attempt with new dynamic URL:",
          newUrl,
        );
        setRetryCount((prev) => prev + 1);
        setStreamUrl(newUrl);
      }, STREAM_CONFIG.retryDelay);
    } else {
      setError("Unable to connect to the radio stream. Please try refreshing.");
      console.error("[RadioStream] All retries exhausted.");
    }
  }, [retryCount, attempt, getCandidateUrl, generateStreamUrl, refreshStream]);

  // Get fresh direct stream URL
  const getStreamUrl = useCallback(() => {
    const nextAttempt = attempt;
    const url = getCandidateUrl(nextAttempt === 0 ? 0 : nextAttempt); // current attempt
    return url;
  }, [attempt, getCandidateUrl]);

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
    attempt,
  };
};
