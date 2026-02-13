'use client'

import { useState } from 'react'
import Image from 'next/image'
import ButtonPrimary from '@/app/components/ButtonPrimary'
import PodcastAudioPlayer from '@/app/components/PodcastAudioPlayer'

type PodcastItem = {
  id?: string
  audioUrl?: string | null
  title: string
  subtitle?: string | null
  description?: string | null
  date?: string | null
  duration?: string | null
  image?: string | null
  coverImage?: string | null
}

type PodcastListProps = {
  podcasts?: PodcastItem[]
}

export default function PodcastList({ podcasts = [] }: PodcastListProps) {
  const [currentPodcast, setCurrentPodcast] = useState<PodcastItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayPause = (pod: PodcastItem) => {
    if (currentPodcast && currentPodcast.id === pod.id) {
      // Same podcast - toggle play/pause
      setIsPlaying((prev) => !prev)
    } else {
      // Different podcast - switch to new one and play
      setCurrentPodcast(pod)
      // Small delay to ensure state updates before playing
      setTimeout(() => {
        setIsPlaying(true)
      }, 100)
    }
  }

  return (
    <section className="relative overflow-hidden bg-white pt-12 pb-16">
      {/* Background decorative blob */}
      <div className="pointer-events-none absolute -top-1/8 -right-1/8 z-0 h-full w-1/2">
        <Image
          src="/vstock-home.png"
          alt="background decorative gradient"
          width={800}
          height={800}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-accent mb-4 text-5xl text-gray-900 sm:text-6xl">
          Listen to Our Podcast
        </h2>
        <div className="mb-10 w-1/2 border-t-2 border-gray-200 sm:w-1/3" />

        {/* Podcasts List */}
        {podcasts.length > 0 ? (
          <div className="space-y-4">
            {podcasts.map((pod, idx) => {
              const playing = currentPodcast && currentPodcast.id === pod.id && isPlaying
              return (
                <div
                  key={pod.id || idx}
                  className="flex items-start gap-4 border-b border-gray-200/80 py-8 last:border-b-0 sm:gap-6"
                >
                  {/* Image */}
                  <div className="relative h-28 w-28 flex-shrink-0 sm:h-32 sm:w-32 md:h-40 md:w-40">
                    <img
                      src={pod.image || pod.coverImage || '/8eh-real.svg'}
                      alt="Podcast Thumbnail"
                      className="h-full w-full rounded-2xl object-cover shadow-md"
                    />
                  </div>
                  {/* Details */}
                  <div className="flex-1">
                    <h3 className="font-heading mb-2 text-lg font-bold text-gray-900 sm:text-xl">
                      {pod.title}
                    </h3>
                    <p className="font-body mb-2 text-sm text-gray-500">{pod.subtitle}</p>
                    <p className="font-body mb-4 text-sm leading-relaxed text-gray-600">
                      {pod.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="font-body text-xs text-gray-500 sm:text-sm">
                        {pod.date || ''} &bull; {pod.duration || ''}
                      </p>
                      <ButtonPrimary
                        className="flex !h-12 !w-12 flex-shrink-0 items-center justify-center !rounded-full !p-0"
                        aria-label={playing ? 'Pause Podcast' : 'Play Podcast'}
                        onClick={() => handlePlayPause(pod)}
                      >
                        {playing ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            fill="white"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <rect x="6" y="5" width="4" height="14" />
                            <rect x="14" y="5" width="4" height="14" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            fill="white"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <polygon points="6,4 20,12 6,20" fill="white" />
                          </svg>
                        )}
                      </ButtonPrimary>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">No podcasts available yet.</div>
        )}

        {/* View All Button */}
        <div className="mt-12 text-center">
          <ButtonPrimary
            className="!bg-gray-100 !px-8 !py-3 !font-medium !text-gray-800 hover:!bg-gray-200"
            onClick={() => window.open('/podcast', '_self')}
          >
            View all
          </ButtonPrimary>
        </div>
      </div>

      {/* Render PodcastAudioPlayer if a podcast is selected */}
      {currentPodcast && (
        <PodcastAudioPlayer
          audioUrl={currentPodcast.audioUrl}
          title={currentPodcast.title}
          image={currentPodcast.image || currentPodcast.coverImage || '/8eh-real.svg'}
          subtitle={currentPodcast.subtitle || ''}
          description={currentPodcast.description || ''}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      )}
    </section>
  )
}
