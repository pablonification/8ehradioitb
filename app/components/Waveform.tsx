'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import WaveSurfer from 'wavesurfer.js'

type WaveformProps = {
  audioUrl: string
  announcerName: string
}

const Waveform = ({ audioUrl, announcerName }: WaveformProps) => {
  const waveformContainerRef = useRef<HTMLDivElement | null>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (waveformContainerRef.current) {
      const ws = WaveSurfer.create({
        container: waveformContainerRef.current,
        waveColor: 'rgb(209 213 219)',
        progressColor: 'rgb(249 115 22)',
        url: audioUrl,
        cursorColor: 'transparent',
        barWidth: 3,
        barRadius: 3,
        barGap: 2,
        height: 40, // Sedikit mengurangi tinggi agar pas
      })

      wavesurferRef.current = ws

      ws.on('ready', () => setIsLoading(false))
      ws.on('play', () => setIsPlaying(true))
      ws.on('pause', () => setIsPlaying(false))

      return () => {
        ws.destroy()
      }
    }
  }, [audioUrl])

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause()
    }
  }

  return (
    // Container utama: flexbox horizontal untuk 2 kolom
    <div className="flex w-full items-center space-x-4">
      {/* Kolom Kiri: Tombol Play/Pause */}
      <button
        onClick={handlePlayPause}
        disabled={isLoading}
        className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-200 transition-all duration-100 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
        ) : isPlaying ? (
          <Image src="/pause.svg" alt="Pause" width={16} height={16} />
        ) : (
          <Image src="/play-button-arrowhead.svg" alt="Play" width={12} height={12} />
        )}
      </button>

      {/* Kolom Kanan: flexbox vertikal untuk waveform dan teks */}
      <div className="flex w-full flex-col">
        {/* Bagian atas kolom kanan: Waveform */}
        <div ref={waveformContainerRef} className="w-full cursor-pointer" />

        {/* Bagian bawah kolom kanan: Label Suara */}
        <span className="mt-1 text-xs font-semibold text-gray-900">
          Sample Voice - {announcerName}
        </span>
      </div>
    </div>
  )
}

export default Waveform
