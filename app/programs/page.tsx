'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import 'swiper/css'
import Navbar from '../components/Navbar'
import FooterSection from '../components/FooterSection'
import useSWR from 'swr'
import ProgramsSlider from '../components/ProgramsSlider'

type ProgramVideo = {
  id: string
  title: string
  link: string
  thumbnail: string
}

const fetcher = async (url: string): Promise<ProgramVideo[]> => {
  const res = await fetch(url)
  return res.json()
}

const programs = [
  {
    logo: '/ctrl-logo.png',
    title: 'CTRL: Coba Tanya Radio Lo!',
    description:
      'Kampus Mania bingung mau nanya siapa? Tenang, sekarang CTRL hadir untuk mencari jawaban dari segala kebingungan Kampus Mania!',
    link: '/programs',
  },
  {
    logo: '/gws-logo.png',
    title: 'GWS: Gather With Us',
    description:
      'Kali ini 8EH Radio ITB kembali dengan podcast yang super seru, GWS! Bukan get well soon, tapi Gather With Us.',
    link: '/programs',
  },
]

const highlightsData = [
  {
    imageUrl: '/highlight-2.png',
    altText: 'Highlight Program Dulu vs Sekarang',
    link: 'https://www.instagram.com/p/DKCKgOjyM9p/',
  },
  {
    imageUrl: '/highlight-1.jpg',
    altText: 'Highlight Program Coba Tanya Radio Lo!',
    link: 'https://www.instagram.com/p/DL4t269Jt-B/',
  },
  {
    imageUrl: '/highlight-3.jpg',
    altText: 'Highlight Program Kumal',
    link: 'https://www.instagram.com/p/DMKN7O0pgbx/',
  },
]
const ProgramHero = () => {
  return (
    <section className="relative overflow-hidden py-16">
      <div className="absolute top-1/4 right-0 w-40 opacity-30 md:w-80">
        <Image
          src="/vstock-programs-2.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/4 right-0 w-30 opacity-30 md:w-60">
        <Image
          src="/vstock-programs-3.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-5/8 left-0 w-40 opacity-70 md:w-60">
        <Image
          src="/vstock-programs-4.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-11/16 left-0 w-30 opacity-70 md:w-50">
        <Image
          src="/vstock-programs-5.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>

      <ProgramsSlider title="Our Programs" subtitle="Explore 8EH Radio ITB" programs={programs} />
    </section>
  )
}

const PodcastSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const { data: videos, isLoading } = useSWR<ProgramVideo[]>('/api/program-videos', fetcher)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef
      const scrollAmount = current.offsetWidth // Scroll by the container width
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute top-0 right-0 w-40 opacity-70 md:top-1/16 md:w-60">
        <Image
          src="/vstock-programs-6.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-0 right-0 w-40 -translate-y-1/8 opacity-100 md:w-60">
        <Image
          src="/vstock-programs-7.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/4 left-0 w-40 opacity-70 md:w-60">
        <Image
          src="/vstock-programs-8.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/4 left-0 w-40 opacity-70 md:w-80">
        <Image
          src="/vstock-programs-9.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/2 right-0 h-60 w-60 opacity-100">
        <Image
          src="/vstock-programs-10.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/2 right-0 h-60 w-60 opacity-100">
        <Image
          src="/vstock-programs-11.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-12 sm:px-16 lg:px-24">
        <div className="mb-12 flex items-center justify-between">
          <div className="text-center">
            <h3 className="font-accent text-4xl text-gray-900 sm:text-5xl md:text-5xl lg:text-6xl">
              Discover Our Exciting <br />
              Programs at 8EH Radio ITB
            </h3>
          </div>
          {/* Slider Controls */}
          <div className="hidden items-center space-x-2 sm:space-x-4 md:flex">
            <button
              onClick={() => scroll('left')}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200/80 bg-white/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:border-gray-300 hover:bg-white/100 hover:shadow-lg sm:h-14 sm:w-14"
              aria-label="Scroll left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6"
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
            <button
              onClick={() => scroll('right')}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200/80 bg-white/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:border-gray-300 hover:bg-white/100 hover:shadow-lg sm:h-14 sm:w-14"
              aria-label="Scroll right"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6"
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
        </div>

        {/* Horizontal scroll container */}
        <div
          ref={scrollContainerRef}
          className="font-body hide-scrollbar -mx-4 -my-4 flex snap-x snap-mandatory flex-wrap space-x-6 overflow-x-auto scroll-smooth rounded-4xl border border-gray-200/80 bg-gradient-to-b from-white/60 to-yellow-300/30 px-8 py-8 pb-4 backdrop-blur-xs transition-all duration-300 hover:border-gray-300 md:flex-nowrap"
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full flex-shrink-0 animate-pulse snap-center md:w-[calc(33.9%-1.125rem)]"
              >
                <div className="mb-4 h-48 w-full rounded-2xl bg-gray-200" />
                <div className="mx-auto h-6 w-3/4 rounded bg-gray-200" />
              </div>
            ))
          ) : videos && videos.length > 0 ? (
            videos.map((prog, idx: number) => (
              <div
                key={idx}
                className="group w-full flex-shrink-0 snap-center md:w-[calc(33.9%-1.125rem)]"
              >
                <div className="relative mb-4 h-48 w-full overflow-hidden rounded-2xl bg-gray-200/80 transition-all duration-300 group-hover:scale-105 sm:h-48">
                  <Image src={prog.thumbnail} alt={prog.title} fill className="object-cover" />
                </div>
                <div className="justify-center px-2 text-center">
                  <h4 className="font-heading mb-1 text-xl font-semibold text-gray-800">
                    {prog.title}
                  </h4>
                  <p className="font-body text-sm text-gray-500">
                    <Link
                      href={prog.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="my-4 flex items-center justify-center text-sm font-semibold text-red-600 hover:text-red-800"
                    >
                      Watch
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="ml-1 h-4 w-4"
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
                    </Link>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="-translate-y-1.5 text-gray-500">No videos available.</p>
          )}
        </div>
      </div>
    </section>
  )
}

const HighlightsSection = () => {
  return (
    // Latar belakang gelap untuk menonjolkan kartu
    <section className="relative bg-[url('/highlights-bg.png')] bg-cover bg-center bg-no-repeat py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-white"></div>

      <div className="relative container mx-auto px-12">
        {/* Judul "Program Highlights" */}
        <div className="mb-12 flex justify-center">
          <h2 className="font-accent rounded-xl bg-gradient-to-br from-yellow-500/80 via-orange-400/70 to-white/60 px-4 py-3 text-center text-4xl text-black shadow-lg drop-shadow-md backdrop-blur-xs lg:px-12 lg:text-5xl">
            Featured Programs
          </h2>
        </div>

        {/* Grid untuk Kartu Highlight */}
        <div className="flex flex-wrap justify-center gap-8">
          {highlightsData.map((highlight, index) => (
            <a
              key={index}
              href={highlight.link}
              rel="noopener noreferrer"
              target="_blank"
              className="group block transform transition-transform duration-300 ease-in-out hover:scale-105"
            >
              <Image
                src={highlight.imageUrl}
                alt={highlight.altText}
                width={500}
                height={500}
                className="h-60 w-50 rounded-2xl object-cover shadow-lg drop-shadow-xl/30 transition-all group-hover:shadow-2xl group-hover:shadow-yellow-400/30 md:h-90 md:w-70"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

const YoutubeCTA = () => {
  return (
    // Section wrapper untuk memberikan spasi atas dan bawah
    <section className="relative py-16">
      <div className="absolute top-0 left-0 h-30 w-30 opacity-70">
        <Image
          src="/vstock-programs-12.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/2 right-0 h-30 w-30 opacity-70">
        <Image
          src="/vstock-programs-13.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      {/* Container utama yang mengatur layout dan styling */}
      <div className="mx-8 flex flex-col items-center justify-between rounded-4xl border border-gray-200/50 bg-gradient-to-br from-white/70 to-yellow-300/30 px-8 py-8 backdrop-blur-sm transition-all duration-300 md:mx-24 md:flex-row">
        {/* Sisi Kiri: Teks Ajakan */}
        <div className="mb-6 text-center md:mb-0 md:text-left">
          <h2 className="font-accent mb-1 text-4xl font-semibold text-gray-800 md:text-6xl md:font-normal">
            Join Us on Youtube
          </h2>
          <p className="font-body mt-4 max-w-md text-gray-600">
            Nikmati konten-konten seru dari 8EH Radio ITB pada Youtube kami!
          </p>
        </div>

        {/* Sisi Kanan: Tombol YouTube */}
        <a
          href="https://www.youtube.com/@8EHRadioITB" // Ganti dengan URL kanal YouTube Anda
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* Logo di dalam tombol */}
          <div className="mr-3">
            <Image
              src="/youtube.png" // Sediakan gambar logo ini di folder /public/images
              alt="8EH Radio ITB Logo"
              width={300}
              height={300}
              className="rounded-4xl"
            />
          </div>
        </a>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-[#FFF6F4] font-sans">
      <Navbar />
      <ProgramHero />
      <PodcastSection />
      <HighlightsSection />
      <YoutubeCTA />
      <FooterSection />
    </main>
  )
}
