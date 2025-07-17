// File: app/hooks/useGlobalAudio.js
import { useEffect, useRef } from 'react';

// Satu instance audio untuk seluruh aplikasi
let audioInstance = null;

export const useGlobalAudio = () => {
  const audioRef = useRef(null);

  if (typeof window !== 'undefined' && !audioInstance) {
    audioInstance = new Audio();
    audioInstance.preload = 'metadata'; // Optimasi agar tidak langsung download semua
  }

  useEffect(() => {
    audioRef.current = audioInstance;

    // Cleanup saat komponen tidak lagi digunakan
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // Jangan hapus instance, biarkan tetap ada
      }
    };
  }, []);

  return audioRef;
};