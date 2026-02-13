'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

type TuneItem = {
  order: number
  title: string
  artist: string
  coverImage: string | null
  audioUrl: string | null
}

type TuneTrackerProps = {
  tunes?: TuneItem[]
}

export default function TuneTracker({ tunes = [] }: TuneTrackerProps) {
  const [nowPlaying, setNowPlaying] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Fill array to ensure 10 items
  const filledTunes = Array.from({ length: 10 }, (_, i) => {
    // If the passed tunes array has gaps or isn't sorted 1-10 perfectly, we handle it here
    // But ideally server passes sorted top 10.
    // We'll trust the passed index if available, or just map linearly.
    const tune = tunes[i]
    return (
      tune || {
        order: i + 1,
        title: '',
        artist: '',
        coverImage: '/music-1.png',
        audioUrl: null,
      }
    )
  })

  const handlePlay = (idx: number) => {
    const audio = audioRef.current
    if (!audio) return

    if (nowPlaying === idx) {
      audio.pause()
      setNowPlaying(null)
    } else {
      setNowPlaying(idx)
      if (filledTunes[idx].audioUrl) {
        audio.src = `/api/proxy-audio?key=${encodeURIComponent(filledTunes[idx].audioUrl)}`
        audio.play()
      }
    }
  }

  return (
    <section className="relative overflow-hidden bg-white py-24 text-gray-900">
      <audio ref={audioRef} onEnded={() => setNowPlaying(null)} />
      <div className="absolute -right-40 -bottom-40 h-[600px] w-[600px]">
        <Image
          src="/tune-tracker.png"
          alt="Decorative turntable"
          width={900}
          height={900}
          className="h-full w-full object-contain opacity-70 mix-blend-multiply"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <h2 className="font-accent mb-2 text-6xl font-bold text-gray-900">Tune Tracker</h2>
          <p className="font-body text-lg text-gray-600">
            Discover the Hottest Tracks: Our Top 10 Music Charts
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          {filledTunes.map((tune, idx) => {
            const isPlaying = nowPlaying === idx
            return (
              <div
                key={idx}
                className="flex items-center rounded-2xl border border-gray-200/80 bg-white/70 p-3 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-gray-300 hover:bg-gray-50/80"
              >
                <div className="w-8 text-center font-mono font-medium text-gray-400">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="relative mx-4 h-14 w-14 flex-shrink-0 overflow-hidden rounded-full shadow-inner">
                  <img
                    src={
                      tune.coverImage
                        ? `/api/proxy-audio?key=${encodeURIComponent(tune.coverImage)}`
                        : '/8eh-real.svg'
                    }
                    alt={tune.title || `Song ${idx + 1}`}
                    className={`absolute inset-0 h-full w-full object-cover ${isPlaying ? 'animate-[spin_3s_linear_infinite]' : ''}`}
                    style={{ position: 'absolute', inset: 0 }}
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="font-heading font-bold text-gray-800">
                    {tune.title || <span className="text-gray-400 italic">Coming Soon</span>}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {tune.artist || <span className="text-gray-300 italic">Coming Soon</span>}
                  </p>
                </div>
                <button
                  onClick={() => handlePlay(idx)}
                  className="flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-200/90 bg-white shadow-md transition-colors hover:bg-gray-200 disabled:opacity-40"
                  aria-label={`Play ${tune.title}`}
                  disabled={!tune.audioUrl}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700" fill="currentColor">
                    {isPlaying ? (
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    ) : (
                      <path d="M8 5v14l11-7z" />
                    )}
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
