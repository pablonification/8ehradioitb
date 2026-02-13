'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRadioStream } from '@/app/hooks/useRadioStream'

type RadioPlayerProps = {
  className?: string
  showTitle?: boolean
  compact?: boolean
}

const hasErrorName = (value: unknown): value is { name: string } => {
  if (typeof value !== 'object' || value === null || !('name' in value)) {
    return false
  }

  return typeof Reflect.get(value, 'name') === 'string'
}

const RadioPlayer = ({ className = '', showTitle = true, compact = false }: RadioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isBuffering, setIsBuffering] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)

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
  } = useRadioStream()

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadStart = () => {
      setIsLoading(true)
      setIsBuffering(true)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      setIsBuffering(false)
      setError('')
    }

    const handleLoadedData = () => {
      setIsLoading(false)
      setIsBuffering(false)
    }

    const handleWaiting = () => {
      setIsBuffering(true)
    }

    const handlePlaying = () => {
      setIsBuffering(false)
      setIsPlaying(true)
      // Notify other components about play state
      window.dispatchEvent(
        new CustomEvent('audioStateChanged', {
          detail: { isPlaying: true },
        })
      )
    }

    const handlePause = () => {
      setIsPlaying(false)
      // Notify other components about pause state
      window.dispatchEvent(
        new CustomEvent('audioStateChanged', {
          detail: { isPlaying: false },
        })
      )
    }

    const handleError = (event: Event) => {
      console.error('Audio error:', event)
      setIsPlaying(false)
      setIsBuffering(false)
      handleStreamError()
      // Notify other components about error state
      window.dispatchEvent(
        new CustomEvent('audioStateChanged', {
          detail: { isPlaying: false },
        })
      )
    }

    const handleAbort = () => {
      setIsPlaying(false)
      setIsBuffering(false)
    }

    const handleStalled = () => {
      setIsBuffering(true)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // Notify other components about end state
      window.dispatchEvent(
        new CustomEvent('audioStateChanged', {
          detail: { isPlaying: false },
        })
      )
    }

    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)
    audio.addEventListener('abort', handleAbort)
    audio.addEventListener('stalled', handleStalled)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('abort', handleAbort)
      audio.removeEventListener('stalled', handleStalled)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [handleStreamError])

  // Listen for external play/pause triggers (from navbar)
  useEffect(() => {
    const handlePlayerControl = () => {
      if (isPlaying) {
        handlePause()
      } else {
        handlePlay()
      }
    }

    window.addEventListener('triggerPlayerControl', handlePlayerControl)

    return () => {
      window.removeEventListener('triggerPlayerControl', handlePlayerControl)
    }
  }, [isPlaying])

  // Handle play with proper promise handling
  const handlePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      // Cancel any pending play promise
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {})
      }

      // Generate fresh stream URL for new play attempt
      const freshUrl = getStreamUrl()
      audio.src = freshUrl

      // Ensure the browser starts loading the new source before attempting to play (helps on mobile/iOS)
      audio.load()

      setIsLoading(true)
      setError('')

      // Start playing
      playPromiseRef.current = audio.play()
      await playPromiseRef.current

      setIsPlaying(true)
    } catch (playError: unknown) {
      console.error('Play error:', playError)
      setIsPlaying(false)
      setIsLoading(false)

      const errorName = hasErrorName(playError) ? playError.name : ''

      if (errorName === 'AbortError') {
        setError('Playback was interrupted. Please try again.')
      } else if (errorName === 'NotAllowedError') {
        setError('Playback requires user interaction. Please click play again.')
      } else {
        setError('Failed to start playback. Refreshing stream...')
        setTimeout(() => refreshStream(), 1000)
      }
    } finally {
      playPromiseRef.current = null
    }
  }

  const handlePause = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      // Wait for any pending play promise to resolve
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {})
      }

      audio.pause()
      setIsPlaying(false)
    } catch (error) {
      console.error('Pause error:', error)
      setIsPlaying(false)
    }
  }

  const togglePlay = async () => {
    if (isPlaying) {
      await handlePause()
    } else {
      await handlePlay()
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleRefresh = () => {
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
    }
    refreshStream()
  }

  const getPlayButtonText = () => {
    if (isLoading || isBuffering) return '⏳'
    if (isPlaying) return '⏸️'
    return '▶️'
  }

  const getStatusText = () => {
    if (error) return error
    if (isLoading) return 'Loading stream...'
    if (isBuffering) return 'Buffering...'
    if (isPlaying) return 'Playing live stream'
    return 'Ready to play'
  }

  if (compact) {
    return (
      <div
        className={`rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm ${className}`}
      >
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={togglePlay}
            disabled={isLoading && !isBuffering}
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-white transition-all duration-300 ${
              isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } ${isBuffering ? 'animate-pulse' : ''} disabled:cursor-not-allowed disabled:bg-gray-500`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="text-lg">{getPlayButtonText()}</span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white/90">
              {showTitle && '🔴 Live Stream - 8EH Radio ITB'}
            </div>
            <div className={`mt-1 text-xs ${error ? 'text-red-200' : 'text-white/70'}`}>
              {getStatusText()}
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition-colors duration-300 hover:bg-blue-600"
            aria-label="Refresh stream"
          >
            <span className="text-sm">🔄</span>
          </button>
        </div>

        <audio ref={audioRef} src={streamUrl || undefined} preload="none" playsInline />
      </div>
    )
  }

  return (
    <div
      className={`rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-sm ${className}`}
    >
      {showTitle && (
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold text-white">8EH Radio ITB</h3>
          <p className="text-sm text-white/80">Live Stream</p>
        </div>
      )}

      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={togglePlay}
          disabled={isLoading && !isBuffering}
          className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg transition-all duration-300 ${
            isPlaying
              ? 'bg-red-500 hover:scale-105 hover:bg-red-600'
              : 'bg-green-500 hover:scale-105 hover:bg-green-600'
          } ${isBuffering ? 'animate-pulse' : ''} disabled:cursor-not-allowed disabled:bg-gray-500 disabled:hover:scale-100`}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {getPlayButtonText()}
        </button>

        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <span className="text-sm text-white">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-white/20"
              aria-label="Volume control"
            />
            <span className="min-w-[40px] text-sm text-white/80">{Math.round(volume * 100)}%</span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white transition-all duration-300 hover:scale-105 hover:bg-blue-600"
          aria-label="Refresh stream"
        >
          🔄
        </button>
      </div>

      <div className="text-center">
        <div className={`text-sm ${error ? 'text-red-200' : 'text-white/80'}`}>
          {getStatusText()}
        </div>

        {retryCount > 0 && (
          <div className="mt-1 text-xs text-white/60">Retry attempt: {retryCount}</div>
        )}
      </div>

      <audio ref={audioRef} src={streamUrl || undefined} preload="none" playsInline />
    </div>
  )
}

export default RadioPlayer
