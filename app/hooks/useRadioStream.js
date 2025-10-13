// app/hooks/useRadioStream.js
import { useState, useEffect, useCallback } from "react";

export const useRadioStream = () => {
  const [streamUrl, setStreamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [config, setConfig] = useState({ defaultUrl: "https://s3.free-shoutcast.com/stream/18032", fallbackUrl: "https://s3.free-shoutcast.com/stream/18032" });

  // Fetch config from API
  useEffect(() => {
    fetch("/api/stream-config")
      .then((res) => res.json())
      .then((data) => {
        setConfig({
          defaultUrl: data?.defaultUrl || "https://s3.free-shoutcast.com/stream/18032",
          fallbackUrl: data?.fallbackUrl || "https://s3.free-shoutcast.com/stream/18032",
        });
      });
  }, []);

  // Configuration for the streaming service
  const STREAM_CONFIG = {
    baseUrl: config.defaultUrl,
    fallbackUrl: config.fallbackUrl,
    maxRetries: 3,
    retryDelay: 2000,
  };

  // Generate dynamic stream URL similar to embed player
  const generateStreamUrl = useCallback(() => {
    // Generate a 6-character alphanumeric code (letters & digits)
    const randomCode = Math.random().toString(36).substring(2, 8);
    // Use HTTP for streaming (required by shoutcast) - proxy through our API to avoid mixed content issues
    return `/api/stream?url=${encodeURIComponent(`${STREAM_CONFIG.baseUrl}/;?type=http&nocache=${randomCode}`)}`;
  }, [STREAM_CONFIG.baseUrl]);

  // Detect if running on an iOS device (iPhone, iPod, iPad)
  // isIOS tidak lagi digunakan untuk menentukan URL streaming
  // const isIOS =
  //   typeof window !== "undefined" &&
  //   /iP(hone|od|ad)/i.test(window.navigator.userAgent);

  // Initialize stream URL
  useEffect(() => {
    // Selalu gunakan generateStreamUrl untuk semua perangkat
    const url = generateStreamUrl();
    setStreamUrl(url);
    // eslint-disable-next-line
  }, [generateStreamUrl, config.defaultUrl]); // Hapus isIOS dari dependencies

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
      // Generate HTTP fallback URL with random cache buster - proxy through our API
      const randomCode = Math.random().toString(36).substring(2, 8);
      setStreamUrl(`/api/stream?url=${encodeURIComponent(`${STREAM_CONFIG.fallbackUrl}/;?type=http&nocache=${randomCode}`)}`);
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
  }, [retryCount, generateStreamUrl, STREAM_CONFIG.fallbackUrl]);

  // Get stream URL with fresh session (tidak lagi menggunakan isIOS kondisional)
  const getStreamUrl = useCallback(() => {
    return generateStreamUrl(); // Selalu panggil generateStreamUrl
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