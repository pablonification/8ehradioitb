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
      if (advance) {
        setAttempt((prev) => {
          const next = Math.min(prev + 1, 2);
          const newUrl = getCandidateUrl(next);
          console.log(`[RadioStream] Advancing to attempt ${next}:`, newUrl);
          setStreamUrl(newUrl);
          return next;
        });
      } else {
        // Reset to first attempt
        setAttempt(0);
        const newUrl = getCandidateUrl(0);
        console.log(`[RadioStream] Resetting to attempt 0:`, newUrl);
        setStreamUrl(newUrl);
      }
    },
    [getCandidateUrl],
  );

  // Handle stream errors with fallback logic
  const handleStreamError = useCallback(() => {
    console.error("[RadioStream] Stream error encountered");
    console.log(
      "[RadioStream] Current attempt:",
      attempt,
      "Retry count:",
      retryCount,
    );
    setIsLoading(false);

    // If we haven't tried all attempts yet, advance to next
    if (attempt < 2) {
      const attemptNames = ["dynamic HTTPS", "static HTTPS", "proxy server"];
      setError(
        `${attemptNames[attempt]} failed. Trying ${attemptNames[attempt + 1]}...`,
      );
      setRetryCount(0); // Reset retry count for new attempt

      setTimeout(() => {
        setAttempt((prev) => {
          const next = prev + 1;
          const newUrl = getCandidateUrl(next);
          console.log(`[RadioStream] Advancing to attempt ${next}:`, newUrl);
          setStreamUrl(newUrl);
          return next;
        });
      }, 1000);
    } else if (retryCount < STREAM_CONFIG.maxRetries) {
      // All attempts exhausted, retry current attempt
      setError(
        `Connection failed. Retrying... (${retryCount + 1}/${STREAM_CONFIG.maxRetries})`,
      );
      setRetryCount((prev) => prev + 1);

      setTimeout(() => {
        // For proxy attempt, just retry same URL
        const newUrl = attempt === 2 ? streamUrl : generateStreamUrl();
        console.log(
          `[RadioStream] Retrying attempt ${attempt} with URL:`,
          newUrl,
        );
        setStreamUrl(newUrl);
      }, STREAM_CONFIG.retryDelay);
    } else {
      setError(
        "Unable to connect. Try manual refresh or check your connection.",
      );
      console.error("[RadioStream] All attempts and retries exhausted.");
    }
  }, [retryCount, attempt, getCandidateUrl, generateStreamUrl, streamUrl]);

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
