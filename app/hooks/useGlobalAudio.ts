import { useEffect, useRef, type MutableRefObject } from 'react'

interface AudioWindow extends Window {
  __globalAudioInstance?: HTMLAudioElement
}

const getAudioInstance = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null

  const audioWindow = window as AudioWindow
  if (!audioWindow.__globalAudioInstance) {
    const audio = new Audio()
    audio.preload = 'metadata'
    audioWindow.__globalAudioInstance = audio
  }

  return audioWindow.__globalAudioInstance
}

export const useGlobalAudio = (): MutableRefObject<HTMLAudioElement | null> => {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = getAudioInstance()

    // Cleanup saat komponen tidak lagi digunakan
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        // Jangan hapus instance, biarkan tetap ada
      }
    }
  }, [])

  return audioRef
}
