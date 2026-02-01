"use client";

import { useRef } from "react";
import ProgramsHeader from "@/app/components/ProgramsHeader";

const programs = [
  {
    title: "Hias Kue Ultah",
    schedule: "Thursday 11.00 - 13.00",
    image: "/placeholder-program.png",
  },
  {
    title: "Dulu vs Sekarang",
    schedule: "Thursday 11.00 - 13.00",
    image: "/placeholder-program.png",
  },
  {
    title: "Gather With Us!",
    schedule: "Thursday 11.00 - 13.00",
    image: "/placeholder-program.png",
  },
  {
    title: "Night Drive",
    schedule: "Friday 20.00 - 22.00",
    image: "/placeholder-program.png",
  },
  {
    title: "Morning Brew",
    schedule: "Monday 08.00 - 10.00",
    image: "/placeholder-program.png",
  },
];

export default function ProgramsSection() {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.offsetWidth; // Scroll by the container width
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-[#FFF8F8] to-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProgramsHeader
          onScrollLeft={() => scroll("left")}
          onScrollRight={() => scroll("right")}
        />

        {/* Horizontal scroll container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scroll-smooth space-x-6 pb-4 -mx-4 px-4 -my-4 py-4 snap-x snap-mandatory hide-scrollbar"
        >
          {programs.map((prog, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-full sm:w-[calc(25%-1.125rem)] snap-center group"
            >
              <div className="relative w-full h-64 sm:h-72 rounded-2xl mb-4 bg-gray-200/80 overflow-hidden transition-all duration-300 group-hover:scale-105">
                {/* Image will go here */}
              </div>
              <div className="text-center px-2">
                <h4 className="font-heading text-xl font-bold text-gray-800 mb-1 truncate">
                  {prog.title}
                </h4>
                <p className="font-body text-sm text-gray-500">
                  {prog.schedule}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
