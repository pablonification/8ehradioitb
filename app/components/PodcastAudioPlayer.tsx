'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useGlobalAudio } from '@/app/hooks/useGlobalAudio' // Import hook yang baru kita buat

interface PodcastAudioPlayerProps {
  audioUrl?: string | null
  title: string
  image?: string
  subtitle?: string
  description?: string
  isPlaying: boolean
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>
}

const PodcastAudioPlayer = ({
  audioUrl,
  title,
  image,
  subtitle,
  description,
  isPlaying,
  setIsPlaying,
}: PodcastAudioPlayerProps) => {
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isRepeat, setIsRepeat] = useState(false)
  const [showMobileExpanded, setShowMobileExpanded] = useState(false)
  const [hasLoadedPodcast, setHasLoadedPodcast] = useState(false)

  // Gunakan hook untuk mendapatkan referensi audio yang terjamin ada
  const audioRef = useGlobalAudio()
  // Use a ref to track external pause
  const externalPauseRef = useRef(false)

  // Efek utama untuk mengontrol audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audioUrl) {
      // Always show player when audioUrl is provided
      setShowPlayer(true)
      setHasLoadedPodcast(true)
      const fullUrl = audioUrl.startsWith('/')
        ? audioUrl
        : `/api/proxy-audio?key=${encodeURIComponent(audioUrl)}`

      if (audio.src !== window.location.origin + fullUrl) {
        audio.src = fullUrl
        audio.load()
      }

      if (isPlaying) {
        audio.play().catch((e) => {
          console.error('Audio play error:', e)
          setIsPlaying(false)
        })
      } else {
        audio.pause()
      }
    } else {
      // Only hide player when no audioUrl is provided
      setShowPlayer(false)
      setHasLoadedPodcast(false)
      setIsPlaying(false)
    }
  }, [audioUrl, isPlaying, audioRef, setIsPlaying])

  // Efek untuk sinkronisasi dengan radio dan update UI
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Pause podcast if radio starts
    const handleRadioPlay = () => {
      setIsPlaying(false)
      externalPauseRef.current = true
    }
    window.addEventListener('radioPlayRequested', handleRadioPlay)

    // When podcast starts playing, pause radio
    if (isPlaying) {
      window.dispatchEvent(new CustomEvent('podcastPlayRequested'))
    }

    const handleTimeUpdate = () => setProgress(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      window.removeEventListener('radioPlayRequested', handleRadioPlay)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [audioRef, setIsPlaying, isPlaying])

  // Separate effect for handling audio ended with current repeat state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play().catch((e) => {
          console.error('Audio repeat play error:', e)
          setIsPlaying(false)
        })
      } else {
        setIsPlaying(false)
      }
    }

    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioRef, isRepeat, setIsPlaying])

  // This effect must be at the top level, not inside another useEffect
  useEffect(() => {
    // Only hide player if pause was external (radio play) AND no podcast has been loaded
    if (!isPlaying && externalPauseRef.current && !hasLoadedPodcast) {
      setShowPlayer(false)
      externalPauseRef.current = false
    }
    // If pause was user-initiated, keep player visible
    // If podcast has been loaded, keep player visible even when paused
  }, [isPlaying, hasLoadedPodcast])

  // Efek untuk volume
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = muted ? 0 : volume
    }
  }, [volume, muted, audioRef])

  const togglePlay = () => setIsPlaying((p) => !p)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setVolume(parseFloat(e.target.value))
  const toggleMute = () => setMuted((p) => !p)
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value)
  }

  // Skip functionality
  const skipBackward = () => {
    if (audioRef.current) {
      const newTime = Math.max(0, audioRef.current.currentTime - 10)
      audioRef.current.currentTime = newTime
    }
  }

  const skipForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10)
      audioRef.current.currentTime = newTime
    }
  }

  const toggleRepeat = () => setIsRepeat((r) => !r)
  const toggleMobileExpanded = () => setShowMobileExpanded((prev) => !prev)

  // Function to clear podcast state (can be called from parent component)
  const clearPodcast = () => {
    setShowPlayer(false)
    setHasLoadedPodcast(false)
    setIsPlaying(false)
    setShowMobileExpanded(false)
    setProgress(0)
    setDuration(0)
  }

  const formatTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!showPlayer) return null

  return (
    <>
      {/* Mobile Expanded Overlay */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ease-out md:hidden ${
          showMobileExpanded
            ? 'pointer-events-auto bg-black/50'
            : 'pointer-events-none bg-transparent'
        }`}
        onClick={toggleMobileExpanded}
      >
        <div
          className={`absolute right-0 bottom-0 left-0 mb-4 rounded-t-3xl bg-white p-6 transition-all duration-300 ease-out ${
            showMobileExpanded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {/* Close button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={toggleMobileExpanded}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-600">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {/* Podcast Info */}
          <div
            className={`mb-6 flex items-center gap-4 transition-all delay-100 duration-500 ${
              showMobileExpanded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200 shadow-lg">
              <img
                src={image || '/8eh-real.svg'}
                alt="cover"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading mb-1 text-base font-bold text-gray-800">{title}</h3>
              {subtitle && <p className="font-body text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className={`mb-6 transition-all delay-200 duration-500 ${
              showMobileExpanded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <div className="font-body mb-2 flex items-center gap-3 text-xs text-gray-500">
              <span>{formatTime(progress)}</span>
              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={progress}
                  onChange={handleSeek}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200"
                  style={{
                    background: `linear-gradient(to right, #EA4A30 0%, #EA4A30 ${(progress / (duration || 1)) * 100}%, #e5e7eb ${(progress / (duration || 1)) * 100}%, #e5e7eb 100%)`,
                  }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="mb-6 flex items-center justify-center gap-6">
            <button
              onClick={skipBackward}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
              title="Skip backward 10 seconds"
            >
              <img src="/fb.svg" alt="Skip backward" className="h-6 w-6" />
            </button>

            <button
              onClick={togglePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EA4A30] text-white shadow-lg"
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                  <path d="M8 5v14l11-7z"></path>
                </svg>
              )}
            </button>

            <button
              onClick={skipForward}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
              title="Skip forward 10 seconds"
            >
              <img src="/ff.svg" alt="Skip forward" className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Player Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-50">
        <div className="mx-auto flex max-w-full flex-col items-center gap-2 bg-white px-2 py-1 shadow-2xl md:flex-row md:gap-4 md:px-6 md:py-2 lg:px-60">
          <div className="flex w-full items-center gap-2 md:w-auto md:flex-shrink-0 md:gap-3">
            {/* Play button moved here for mobile */}
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xl text-gray-800 ring-1 ring-gray-300 transition-all hover:ring-gray-900 md:hidden"
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M8 5v14l11-7z"></path>
                </svg>
              )}
            </button>
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-200 shadow-sm md:h-14 md:w-14">
              <img
                src={image || '/8eh-real.svg'}
                alt="cover"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="w-48 min-w-0 flex-shrink-0 overflow-hidden text-sm md:w-60">
              <p className="font-heading truncate text-xs font-bold text-gray-800 md:text-sm">
                {title}
              </p>
              {subtitle && (
                <p className="font-body truncate text-xs text-gray-500 md:text-sm">{subtitle}</p>
              )}
              {description && (
                <p className="font-body hidden max-w-xs truncate text-gray-400 md:block">
                  {description}
                </p>
              )}
            </div>

            {/* Mobile Expand Button */}
            <button
              onClick={toggleMobileExpanded}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 transition-all duration-200 hover:bg-gray-200 md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`h-4 w-4 text-gray-600 transition-transform duration-300 ${showMobileExpanded ? 'rotate-180' : ''}`}
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </button>
          </div>
          {/* Controls & Progress - Desktop only */}
          <div className="mx-2 hidden min-w-0 flex-1 flex-col items-center justify-center md:flex">
            <div className="flex w-full items-center justify-center gap-6">
              <button
                onClick={skipBackward}
                className="text-xl text-gray-500 transition-all duration-200 hover:scale-110 hover:text-black disabled:opacity-40"
                title="Skip backward 10 seconds"
              >
                <img src="/fb.svg" alt="Skip backward" className="h-5 w-5" />
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
              <button
                onClick={skipForward}
                className="text-xl text-gray-500 transition-all duration-200 hover:scale-110 hover:text-black disabled:opacity-40"
                title="Skip forward 10 seconds"
              >
                <img src="/ff.svg" alt="Skip forward" className="h-5 w-5" />
              </button>
              <button
                onClick={toggleRepeat}
                className={`text-xl transition-colors ${
                  isRepeat ? 'text-blue-600 hover:text-blue-700' : 'text-gray-500 hover:text-black'
                }`}
                title={isRepeat ? 'Repeat: On' : 'Repeat: Off'}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                </svg>
              </button>
            </div>
            <div className="mt-2 flex w-full min-w-0 items-center gap-2 text-[10px] text-gray-500">
              <span className="font-body w-8 flex-shrink-0 text-right">{formatTime(progress)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={handleSeek}
                className="relative h-3 min-w-0 flex-grow rounded-full bg-gray-200"
              />
              <span className="font-body w-8 flex-shrink-0 text-left">{formatTime(duration)}</span>
            </div>
          </div>
          <div className="hidden w-32 flex-shrink-0 items-center justify-end gap-2 md:flex">
            <button
              type="button"
              onClick={toggleMute}
              className="cursor-pointer text-gray-600 hover:text-black focus:outline-none"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
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
              step="0.01"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="h-1 w-20 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-800 md:w-24"
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default PodcastAudioPlayer
