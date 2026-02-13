'use client'

import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { SwiperRef } from 'swiper/react'
import { useRef } from 'react'
import 'swiper/css'

type ProgramItem = {
  logo: string
  title: string
  description: string
  link: string
}

type ProgramsSliderProps = {
  title: string
  subtitle: string
  programs: ProgramItem[]
}

export default function ProgramsSlider({ title, subtitle, programs }: ProgramsSliderProps) {
  const swiperRef = useRef<SwiperRef | null>(null)

  const onScrollLeft = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slidePrev()
    }
  }

  const onScrollRight = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideNext()
    }
  }
  return (
    <section id="podcast-programs" className="relative overflow-hidden py-20 lg:py-24">
      <div className="absolute inset-0 top-1/8 left-0 w-40 opacity-70 md:w-60">
        <Image
          src="/vstock-programs-1.png"
          alt="Decorative Checkmark"
          width={300}
          height={300}
          className=""
        />
      </div>
      <div className="absolute top-1/4 right-0 w-40 opacity-100 md:w-100">
        <Image
          src="/vstock-podcast-4.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-24">
        <div className="mx-0 md:mx-12 lg:mx-24">
          <div className="mb-12 flex items-center justify-between">
            <div className="text-left">
              <p className="mx-auto mb-2 max-w-md text-lg font-bold text-gray-800 md:mx-0">
                {subtitle}
              </p>
              <h2 className="font-accent text-left text-5xl text-gray-800 lg:text-6xl">{title}</h2>
            </div>
            {/* Slider Controls */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={onScrollLeft}
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
                onClick={onScrollRight}
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
        </div>

        <Swiper
          ref={swiperRef}
          slidesPerView={1.2}
          spaceBetween={20}
          centeredSlides={false}
          loop={false}
          breakpoints={{
            768: {
              slidesPerView: 1.3,
              spaceBetween: 30,
            },
            1024: {
              slidesPerView: 2,
              spaceBetween: 40,
            },
          }}
          className="!overflow-visible"
        >
          {programs.map((program, index: number) => (
            <SwiperSlide key={index}>
              {/* <Link href={program.link}> */}
              <div className="flex h-84 flex-col justify-between overflow-hidden rounded-3xl border border-gray-200/80 bg-gradient-to-br from-orange-600/80 via-yellow-500/50 to-yellow-100/30 px-8 pt-8 pb-8 shadow-xl backdrop-blur-xs transition-all duration-300 hover:border-gray-400 md:h-96 md:pt-8 lg:px-20">
                <div className="flex flex-wrap items-center justify-center">
                  <div className="mb-4 flex w-full justify-center lg:h-40">
                    <Image
                      src={program.logo}
                      alt={`${program.title} logo`}
                      width={300}
                      height={300}
                      className="w-50 object-contain drop-shadow-lg md:w-70"
                    />
                  </div>
                  <div>
                    <h3 className="font-heading text-center text-xl font-bold text-gray-800 lg:text-3xl">
                      {program.title}
                    </h3>
                    <p className="font-body mx-auto mt-2 max-w-md text-center text-sm text-gray-600 lg:text-base">
                      {program.description}
                    </p>
                  </div>
                </div>
              </div>
              {/* </Link> */}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
