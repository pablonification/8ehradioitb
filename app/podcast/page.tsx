'use client' // Diperlukan karena slider menggunakan state dan event browser
import Navbar from '../components/Navbar'
import FooterSection from '../components/FooterSection'
import Image from 'next/image'
import ButtonPrimary from '../components/ButtonPrimary'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { useEffect, useState } from 'react'
import PodcastAudioPlayer from '../components/PodcastAudioPlayer'
import ProgramsSlider from '../components/ProgramsSlider'

type PodcastItem = {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  date: string | null
  duration: string | null
  image: string | null
  coverImage: string | null
  audioUrl: string | null
}

const programs = [
  {
    logo: '/ctrl-logo.png', // Logo dari gambar
    title: 'CTRL: Coba Tanya Radio Lo!',
    description:
      'Kampus Mania bingung mau nanya siapa? Tenang, sekarang CTRL hadir untuk mencari jawaban dari segala kebingungan Kampus Mania!',
    link: '/programs/gws',
  },
  {
    logo: '/gws-logo.png', // Contoh program lain
    title: 'GWS: Gather With Us',
    description:
      'Kali ini 8EH Radio ITB kembali dengan podcast yang super seru, GWS! Bukan get well soon, tapi Gather With Us.',
    link: '/programs/on-air',
  },
]

const PodcastHero = () => {
  return (
    // Section utama dengan padding, latar belakang, dan positioning relatif untuk elemen dekoratif
    <section className="relative w-full overflow-hidden bg-[#FDFBF8] px-4 py-24 sm:px-8 lg:px-36">
      {/* Elemen Dekoratif di Latar Belakang */}
      <div className="absolute inset-0 z-0">
        {/* Bentuk Abstrak/Halftone */}
        <Image
          src="/vstock-podcast-1.png" // Sediakan gambar ini di folder public
          alt="Abstract Shape"
          width={100}
          height={100}
          className="absolute top-0 left-0 z-1 w-20 opacity-70 md:top-1/3"
        />
        <Image
          src="/vstock-podcast-2.png" // Sediakan gambar ini di folder public
          alt="Abstract Shape"
          width={100}
          height={100}
          className="absolute top-[5%] right-0 z-1 translate-x-10 opacity-70 md:top-[8%] md:left-1/3 md:translate-x-0"
        />
        <Image
          src="/vstock-podcast-5.png" // Sediakan gambar ini di folder public
          alt="Abstract Shape"
          width={200}
          height={200}
          className="absolute right-0 bottom-[10%] z-1 w-30 translate-x-[10%] opacity-90 md:top-[10%] md:w-50 md:translate-x-20"
        />
        <Image
          src="/vstock-podcast-6.png" // Sediakan gambar ini di folder public
          alt="Abstract Shape"
          width={200}
          height={200}
          className="absolute top-0 left-0 z-0 w-70 -translate-x-[30%] opacity-80 md:top-[5%] md:translate-x-0"
        />
        <Image
          src="/vstock-podcast-7.png" // Sediakan gambar ini di folder public
          alt="Abstract Shape"
          width={200}
          height={200}
          className="absolute top-[40%] right-[3%] z-0 w-150 translate-x-[40%] opacity-90 md:top-[3%] md:translate-x-0"
        />
        <Image
          src="/vstock-podcast-8.png" // Sediakan gambar ini di folder public
          alt="Abstract Shape"
          width={200}
          height={200}
          className="absolute top-[40%] right-0 z-0 w-70 translate-x-[50%] opacity-90 md:top-[5%] md:w-100 md:translate-x-0"
        />
      </div>

      {/* Kontainer Konten Utama */}
      <div className="relative z-20 mx-auto flex max-w-7xl flex-col items-center justify-between px-4 md:flex-row">
        {/* Sisi Kiri: Teks & Tombol */}
        <div className="mb-12 text-start md:mb-0 md:w-1/2">
          <h1 className="font-accent mb-6 text-6xl font-medium text-gray-800 md:text-8xl">
            Our Podcasts
          </h1>
          <p className="mx-auto mb-8 max-w-md text-lg text-gray-600 md:mx-0">
            Rasakan serunya podcast 8EH, tempat di mana diskusi seru dan cerita menghibur hadir
            untukmu! Yuk, jelajahi kehidupan kampus yang dikemas dengan gaya khas kami yang penuh
            warna dan energi!
          </p>
          <ButtonPrimary
            className="!bg-[#EFEAE6]/80 !px-8 !py-3 !text-[#444] hover:!bg-[#E5DED8]"
            onClick={() => {
              const element = document.getElementById('podcast-programs')
              if (element) {
                element.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
            }}
          >
            Explore
          </ButtonPrimary>
        </div>

        {/* Sisi Kanan: Gambar Player */}
        <div className="relative -mt-10 flex justify-center md:-mt-20 md:w-1/2 md:justify-end">
          <div className="relative h-[500px] w-[500px]">
            {/* Gambar Frame Player PNG */}
            <Image
              src="/player-podcast.png" // Path ke PNG player
              alt="Modern podcast player with earbuds"
              layout="fill"
              objectFit="contain"
              className="z-0 drop-shadow-2xl"
            />
            <div className="absolute bottom-[16%] left-[42.5%] z-10 rotate-12">
              {/* <button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("triggerPlayerControl"))
                }
                className="w-13 h-13 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0 border border-gray-200/90 shadow-md cursor-pointer"
                aria-label={`Play`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-gray-700"
                  fill="currentColor"
                >
                  {<path d="M8 5v14l11-7z" />}
                </svg>
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const PODCASTS_PER_PAGE = 3 // Easily change this value to adjust per page

const PodcastEpisodes = () => {
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentPodcast, setCurrentPodcast] = useState<PodcastItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    fetch('/api/podcast')
      .then((res) => res.json())
      .then((data: PodcastItem[]) => {
        setPodcasts(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load podcasts')
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="py-8 text-center">Loading...</div>
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>

  // Pagination logic
  const totalPages = Math.ceil(podcasts.length / PODCASTS_PER_PAGE)
  const indexOfLast = currentPage * PODCASTS_PER_PAGE
  const indexOfFirst = indexOfLast - PODCASTS_PER_PAGE
  const currentPodcasts = podcasts.slice(indexOfFirst, indexOfLast)

  // Fade animation on page change
  const handlePageChange = (newPage: number) => {
    if (isAnimating || newPage < 1 || newPage > totalPages) return
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentPage(newPage)
      setIsAnimating(false)
    }, 250) // duration matches transition
  }

  const handlePlayPause = (pod: PodcastItem) => {
    if (currentPodcast && currentPodcast.id === pod.id) {
      setIsPlaying((prev) => !prev)
    } else {
      setCurrentPodcast(pod)
      setIsPlaying(true)
    }
  }

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-black/0 from-0% to-black to-5% pt-24 text-white md:to-15%"
      id="podcast-programs"
    >
      <div className="absolute top-0 right-0 w-100 -rotate-17 opacity-20 md:top-1/3 md:right-0 md:w-180">
        <Image
          src="/boombox-podcast.png"
          alt="Decorative Checkmark"
          width={1000}
          height={1000}
          className=""
        />
      </div>
      <div className="absolute bottom-0 left-0 w-40 rotate-44 opacity-30 md:top-0 md:w-100 md:-translate-x-20">
        <Image
          src="/mic-podcast.png"
          alt="Decorative Checkmark"
          width={1000}
          height={1000}
          className=""
        />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl">
        <p className="mx-auto mb-4 text-center text-lg font-bold text-gray-100 drop-shadow-md md:mx-0">
          Podcasts
        </p>
        <h2 className="font-accent mb-12 text-center text-6xl drop-shadow-md">
          Latest Podcast Episodes
        </h2>
        <div className="mx-0 mb-12 rounded-4xl border border-gray-200/20 bg-white/15 px-4 py-4 backdrop-blur-sm md:mx-4 md:px-12">
          <div
            className={`space-y-4 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
          >
            {currentPodcasts.map((pod, idx) => {
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
                    <h3 className="font-heading mb-2 text-lg font-bold text-gray-200 sm:text-xl">
                      {pod.title}
                    </h3>
                    <p className="font-body mb-2 text-sm text-gray-300">{pod.subtitle}</p>
                    <p className="font-body mb-4 text-sm leading-relaxed text-gray-300">
                      {pod.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="font-body text-xs text-gray-300 sm:text-sm">
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
        </div>
        {/* Swiper Pagination */}
        {totalPages > 1 && (
          <div className="my-12 flex items-center justify-center space-x-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200/20 bg-white/20 transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <p className="text-lg font-semibold">
              {currentPage}
              <span className="mx-2 text-white/60">/</span>
              {totalPages}
            </p>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200/20 bg-white/20 transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      {/* Render GlobalAudioPlayer at the bottom, passing podcast info if selected */}
      <PodcastAudioPlayer
        audioUrl={currentPodcast?.audioUrl}
        title={currentPodcast?.title || ''}
        image={currentPodcast?.image || currentPodcast?.coverImage || '/8eh-real.svg'}
        subtitle={currentPodcast?.subtitle || ''}
        description={currentPodcast?.description || ''}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />
    </section>
  )
}

export default function PodcastPage() {
  return (
    <main className="font-body overflow-x-hidden bg-[#FEFBF8]">
      <Navbar />
      <PodcastHero />
      <ProgramsSlider
        title="Podcast Programs"
        subtitle="Explore 8EH Radio ITB"
        programs={programs}
      />
      <PodcastEpisodes />
      <FooterSection />
    </main>
  )
}
