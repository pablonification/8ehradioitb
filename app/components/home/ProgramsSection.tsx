'use client'

import { useRef } from 'react'
import ProgramsHeader from '@/app/components/ProgramsHeader'

const programs = [
  {
    title: 'Hias Kue Ultah',
    schedule: 'Thursday 11.00 - 13.00',
    image: '/placeholder-program.png',
  },
  {
    title: 'Dulu vs Sekarang',
    schedule: 'Thursday 11.00 - 13.00',
    image: '/placeholder-program.png',
  },
  {
    title: 'Gather With Us!',
    schedule: 'Thursday 11.00 - 13.00',
    image: '/placeholder-program.png',
  },
  {
    title: 'Night Drive',
    schedule: 'Friday 20.00 - 22.00',
    image: '/placeholder-program.png',
  },
  {
    title: 'Morning Brew',
    schedule: 'Monday 08.00 - 10.00',
    image: '/placeholder-program.png',
  },
]

export default function ProgramsSection() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

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
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF8F8] to-white py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProgramsHeader onScrollLeft={() => scroll('left')} onScrollRight={() => scroll('right')} />

        {/* Horizontal scroll container */}
        <div
          ref={scrollContainerRef}
          className="hide-scrollbar -mx-4 -my-4 flex snap-x snap-mandatory space-x-6 overflow-x-auto scroll-smooth px-4 py-4 pb-4"
        >
          {programs.map((prog, idx) => (
            <div
              key={idx}
              className="group w-full flex-shrink-0 snap-center sm:w-[calc(25%-1.125rem)]"
            >
              <div className="relative mb-4 h-64 w-full overflow-hidden rounded-2xl bg-gray-200/80 transition-all duration-300 group-hover:scale-105 sm:h-72">
                {/* Image will go here */}
              </div>
              <div className="px-2 text-center">
                <h4 className="font-heading mb-1 truncate text-xl font-bold text-gray-800">
                  {prog.title}
                </h4>
                <p className="font-body text-sm text-gray-500">{prog.schedule}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
