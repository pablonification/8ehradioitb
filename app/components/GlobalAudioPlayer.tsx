'use client'
import { useState, useEffect, type ChangeEvent } from 'react'
import Image from 'next/image'

type AudioStateChangedEvent = CustomEvent<{ isPlaying: boolean }>

type PlayerConfig = {
  title: string
  subtitle: string
  coverImage: string
}

/**
 * GlobalAudioPlayer
 * ------------------
 * A fixed player bar that stays at the top of the page while audio is playing.
 * It closely replicates the design shown in the provided screenshot:
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ ▢  Episode 1 …   ────────────────⏮ ⏯ ⏭──────  🔊 ───────      │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Behaviour:
 * 1. The bar is only visible while the stream is playing / loading / buffering.
 * 2. Uses the existing `useRadioStream` hook for fetching + retry logic.
 * 3. Dispatches a `window` custom-event  `audioStateChanged` so other
 *    components (e.g. the Navbar mobile play button) stay in sync.
 */
const GlobalAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showPlayer, setShowPlayer] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Player config state
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig>({
    title: '',
    subtitle: '',
    coverImage: '',
  })

  useEffect(() => {
    // Fetch player config from API
    fetch('/api/player-config')
      .then((res) => res.json())
      .then((data) => {
        setPlayerConfig({
          title: data?.title || '',
          subtitle: data?.subtitle || '',
          coverImage: data?.coverImage || '',
        })
      })
      .catch(() => {
        setPlayerConfig({ title: '', subtitle: '', coverImage: '' })
      })
  }, [])

  /* Listen to global play-state changes */
  useEffect(() => {
    let externalPause = false
    const handler = (e: Event) => {
      const customEvent = e as AudioStateChangedEvent
      const playing = customEvent.detail.isPlaying
      setIsPlaying(playing)
      if (playing) setShowPlayer(true) // show after first play
    }

    window.addEventListener('audioStateChanged', handler)
    // Sinkronisasi: jika podcast mulai play, matikan radio
    const handlePodcastPlay = () => {
      setIsPlaying(false)
      setShowPlayer(false) // Hide radio player UI when podcast starts
      externalPause = true
      window.dispatchEvent(new CustomEvent('pauseRequested'))
    }
    window.addEventListener('podcastPlayRequested', handlePodcastPlay)

    // Hide radio player UI when radio is paused by podcast (external), not by user
    if (!isPlaying && externalPause) {
      setShowPlayer(false)
      externalPause = false
    }

    // Sinkronisasi: jika radio mulai play, matikan podcast
    const handleRadioPlay = () => {
      window.dispatchEvent(new CustomEvent('radioPlayRequested'))
    }
    if (isPlaying) {
      handleRadioPlay()
    }

    return () => {
      window.removeEventListener('audioStateChanged', handler)
      window.removeEventListener('podcastPlayRequested', handlePodcastPlay)
    }
  }, [isPlaying])

  // Saat radio mulai play, broadcast event agar podcast stop
  useEffect(() => {
    if (isPlaying) {
      window.dispatchEvent(new CustomEvent('radioPlayRequested'))
    }
  }, [isPlaying])

  /* --------------------------------------------------------------------- */
  /*                          Event Handlers                               */
  /* --------------------------------------------------------------------- */
  /* --------------------------------------------------------------------- */
  /*                               Handlers                                */
  const togglePlay = () => {
    if (isPlaying) {
      window.dispatchEvent(new CustomEvent('pauseRequested'))
    } else {
      window.dispatchEvent(new CustomEvent('playRequested'))
    }
  }

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value)
    setVolume(newVol)
    setIsMuted(newVol === 0)
    window.dispatchEvent(new CustomEvent('volumeChanged', { detail: { volume: newVol } }))
  }

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false)
      setVolume(1)
      window.dispatchEvent(new CustomEvent('volumeChanged', { detail: { volume: 1 } }))
    } else {
      setIsMuted(true)
      setVolume(0)
      window.dispatchEvent(new CustomEvent('volumeChanged', { detail: { volume: 0 } }))
    }
  }

  const isVisible = showPlayer

  /* --------------------------------------------------------------------- */
  /*                               Render                                  */
  /* --------------------------------------------------------------------- */
  return (
    <>
      {isVisible && (
        <div className="fixed right-0 bottom-0 left-0 z-50">
          {/* Player UI layer */}
          <div className="border border-gray-200/80 bg-white shadow-2xl">
            <div className="mx-auto flex max-w-full flex-col items-center gap-2 px-2 py-1 md:flex-row md:gap-4 md:px-6 md:py-2 lg:px-60">
              {/* 1. Album Art + Song Info */}
              <div className="flex w-full items-center gap-3 md:w-auto md:flex-shrink-0">
                {/* Play button moved here for mobile */}
                <button
                  onClick={togglePlay}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xl text-gray-800 ring-1 ring-gray-300 transition-all hover:ring-gray-900 md:hidden"
                >
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M8 5v14l11-7z"></path>
                    </svg>
                  )}
                </button>
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-200 shadow-sm md:h-14 md:w-14">
                  <img
                    src={playerConfig.coverImage || '/8eh.png'}
                    alt="cover"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>

                <div className="w-48 min-w-0 flex-shrink-0 text-sm md:w-60">
                  <p className="font-heading truncate text-xs font-bold text-gray-800 md:text-sm">
                    {playerConfig.title || '8EH Radio ITB'}
                  </p>
                  <p className="font-body flex items-center gap-2 text-xs text-gray-500 md:text-sm">
                    <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500 md:h-2 md:w-2"></span>
                    </span>
                    Live Now
                  </p>
                </div>
              </div>

              {/* 2. Controls & Progress - Desktop only */}
              <div className="mx-2 hidden min-w-0 flex-1 flex-col items-center justify-center md:flex">
                {/* Desktop: Full controls */}
                <div className="flex w-full items-center justify-center gap-6">
                  {/* Skip buttons - hidden on mobile */}
                  <button
                    className="text-xl text-gray-500 hover:text-black disabled:opacity-40"
                    disabled
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={togglePlay}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-gray-800 ring-1 ring-gray-300 transition-all hover:ring-gray-900"
                  >
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path d="M8 5v14l11-7z"></path>
                      </svg>
                    )}
                  </button>
                  {/* Skip buttons - hidden on mobile */}
                  <button
                    className="text-xl text-gray-500 hover:text-black disabled:opacity-40"
                    disabled
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path>
                    </svg>
                  </button>
                </div>
                {/* Progress bar row - hidden on mobile */}
                <div className="mt-2 flex w-full min-w-0 items-center gap-2 text-[10px] text-gray-500">
                  {/* <span className="w-8 text-right flex-shrink-0">0:00</span> */}
                  <div className="relative h-1 min-w-0 flex-grow rounded-full bg-gray-200">
                    <div
                      className="absolute h-full rounded-full bg-gray-800"
                      style={{ width: '0%' }}
                    />
                  </div>
                  {/* <span className="w-8 text-left flex-shrink-0">0:00</span> */}
                </div>
              </div>

              {/* 3. Volume */}
              <div className="hidden w-32 flex-shrink-0 items-center justify-end gap-2 md:flex">
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  className="cursor-pointer text-gray-600 focus:outline-none"
                >
                  {isMuted || volume === 0 ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path
                        d="M16.5 12a6.5 6.5 0 0 0-6.5-6.5v2A4.5 4.5 0 0 1 14.5 12h2z"
                        fill="#d1d5db"
                      />
                      <path d="M3 9v6h4l5 5V4L7 9H3zm16.5 3a6.5 6.5 0 0 0-6.5-6.5v2A4.5 4.5 0 0 1 17.5 12h2z" />
                      <line x1="19" y1="5" x2="5" y2="19" stroke="#ef4444" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="h-1 w-20 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-800 md:w-24"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GlobalAudioPlayer
