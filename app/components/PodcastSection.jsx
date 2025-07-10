"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Programs
const programs = [
  {
    title: "Dulu VS Sekarang! | Gather With Us Special Podcast",
    link: "",
    image: "/placeholder-program.png",
  },
  {
    title: "Vibes of Belief | Gather With Us #21",
    link: "",
    image: "/placeholder-program.png",
  },
  {
    title: "#6ET2GETHER : Hias Kue Ultah ke-42 8EH!",
    link: "",
    image: "/placeholder-program.png",
  },
  {
    title: "Night Drive",
    link: "",
    image: "/placeholder-program.png",
  },
  {
    title: "Morning Brew",
    link: "",
    image: "/placeholder-program.png",
  },
];

function PodcastSection() {
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
    <section className="relative py-24 overflow-hidden">
      <div className="absolute top-0 md:top-1/16 right-0 w-40 md:w-60 opacity-70">
        <Image
          src="/vstock-programs-6.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-0 -translate-y-1/8 right-0 w-40 md:w-60 opacity-100">
        <Image
          src="/vstock-programs-7.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/4 left-0 w-40 md:w-60 opacity-70">
        <Image
          src="/vstock-programs-8.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/4 left-0 w-40 md:w-80 opacity-70">
        <Image
          src="/vstock-programs-9.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/2 right-0 w-60 h-60 opacity-100">
        <Image
          src="/vstock-programs-10.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/2 right-0 w-60 h-60 opacity-100">
        <Image
          src="/vstock-programs-11.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>

      
      <div className="relative max-w-7xl mx-auto px-12 sm:px-16 lg:px-24">
        <div className="flex justify-between items-center mb-12">
          <div className="text-center">
            <h3 className="font-accent text-4xl sm:text-5xl md:text-5xl lg:text-6xl text-gray-900">
              Discover Our Exciting <br />
              Podcast at 8EH Radio ITB
            </h3>
          </div>
          {/* Slider Controls */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white/100 hover:border-gray-300 transition-all duration-200 flex items-center justify-center border border-gray-200/80 shadow-md hover:shadow-lg cursor-pointer"
              aria-label="Scroll left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
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
              onClick={() => scroll("right")}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white/100 hover:border-gray-300 transition-all duration-200 flex items-center justify-center border border-gray-200/80 shadow-md hover:shadow-lg cursor-pointer"
              aria-label="Scroll right"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
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
          className="flex flex-wrap md:flex-nowrap overflow-x-auto scroll-smooth space-x-6 pb-4 -mx-4 px-8 -my-4 py-8 snap-x snap-mandatory hide-scrollbar bg-gradient-to-b from-white/60 to-yellow-300/30 rounded-4xl backdrop-blur-xs transition-all duration-300 border hover:border-gray-300 border-gray-200/80"
        >
          {programs.map((prog, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-full md:w-[calc(33.9%-1.125rem)] snap-center group"
            >
              <div className="relative w-full h-48 sm:h-48 rounded-2xl mb-4 bg-gray-200/80 overflow-hidden transition-all duration-300 group-hover:scale-105">
                {/* Image will go here */}
              </div>
              <div className="text-center px-2 justify-center">
                <h4 className="font-heading text-xl font-semibold text-gray-800 mb-1">
                  {prog.title}
                </h4>
                <p className="font-body text-sm text-gray-500">
                  <Link
                    href={prog.link}
                    className="text-red-600 hover:text-red-800 my-4 font-semibold justify-center text-sm flex items-center"
                  >
                    Listen
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1"
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
          ))}
        </div>
      </div>
    </section>
  );
}

export default PodcastSection;
