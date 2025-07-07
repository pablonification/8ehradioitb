"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import Navbar from "@/app/components/Navbar";
import ButtonPrimary from "@/app/components/ButtonPrimary";
import BoardSlider from "@/app/components/BoardSlider";
import RadioPlayer from "@/app/components/RadioPlayer";
import FooterSection from "@/app/components/FooterSection";

// ---------------------------------------------------------------------------
//  Placeholder data (to be replaced with real content later)
// ---------------------------------------------------------------------------

// Podcasts
const podcasts = [
  {
    title: "GWS#14: Stereotype Battle! UKM Tersulit Digapai Se-ITB? 8EH VS LFM",
    subtitle: "GWS : Gather With Us",
    description:
      "Emang bener masuk 8EH dan LFM penuh perjuangan?!🤔 GWS #14 bakal bongkar mitos, stereotype, dan cerita kocak dari dua UKM yang katanya cuma buat anak chosen ones. Penasaran siapa yang paling bikin ciut? Dengerin sampai habis ya, Kampus Mania !!",
    date: "Dec 23, 2024",
    duration: "31 min 34 sec",
    image: "/pod1.png",
  },
  {
    title: "GWS #13 : ITB! Kupu-Kupu VS Kura-Kura?",
    subtitle: "GWS : Gather With Us",
    description:
      "GWS! Mahasiswa kupu-kupu tuh apa sih? Kalau mahasiswa kura-kura itu apa? Itu mahasiswa yang punya hewan ya? 🤔 Ga dong Kampus Mania! Tapi kalau penasaran, Kampus Mania wajib dengerin nih bareng Iam dan Ael tentang istilah-istilah stereotype mahasiswa beginian! 😉 Siapa tahu Kampus Mania kan ternyata masuk tipe-tipe yang bakal disebutkan nantinya! 😉",
    date: "Dec 7, 2024",
    duration: "33 min 40 sec",
    image: "/pod2.png",
  },
];

// News
const newsItems = [
  {
    category: "Achievement",
    title: "Work Life Balance 101 (Kru's Version)",
    description:
      "Dibalik siaran radio, ada para Kru yang diam-diam menjadi mahasiswa ambis. Hamzah salah satunya!",
    author: "Aline",
    date: "6 Juni 2025",
    readTime: "5 min read",
    image: "/placeholder-news1.png",
    authorImage: "/8eh-real.svg",
  },
  {
    category: "Events",
    title: "Merakit Asa",
    description:
      "Aksi angkatan MERAKIT'24 SAPPK ITB menjadi bukti bahwa kolaborasi dan kepedulian sosial dapat tumbuh dari lingkungan kampus.",
    author: "Abel",
    date: "4 Juni 2025",
    readTime: "5 min read",
    image: "/placeholder-news2.png",
    authorImage: "/8eh-real.svg",
  },
  {
    category: "News",
    title: "They Call It... The Last Paradise",
    description:
      "Menambang nikel di Raja Ampat adalah bentuk keserakahan yang dibungkus dalih kebutuhan.",
    author: "Zahra, Mahar, & Ody",
    date: "8 Juni 2025",
    readTime: "5 min read",
    image: "/placeholder-news3.png",
    authorImage: "/8eh-real.svg",
  },
];

// Programs
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

// Tune Tracker – top 10 songs (placeholder)
const tunes = [
  {
    title: "Ordinary",
    artist: "Alex Warren",
    image: "/music-1.png",
  },
  {
    title: "Back To Friend",
    artist: "Sombr",
    image: "/music-2.png",
  },
  {
    title: "Birds Of A Feather",
    artist: "Billie Eilish",
    image: "/music-3.png",
  },
  {
    title: "Sapphire",
    artist: "Ed Sheeran",
    image: "/music-4.png",
  },
  {
    title: "Luther (With SZA)",
    artist: "Kendrick Lamar, SZA",
    image: "/music-5.png",
  },
  {
    title: "You'll Be In My Heart",
    artist: "NIKI",
    image: "/music-6.png",
  },
  {
    title: "Monolog",
    artist: "Pamungkas",
    image: "/music-7.png",
  },
  {
    title: "WILDFLOWER",
    artist: "Billie Eilish",
    image: "/music-3.png",
  },
  {
    title: "Rumah ke Rumah",
    artist: "Hindia",
    image: "/music-8.png",
  },
  {
    title: "Die With A Smile",
    artist: "Laddy Gaga, Bruno Mars",
    image: "/music-9.png",
  },
];

// ---------------------------------------------------------------------------
//  Section components – kept in this file to minimize additional files
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section className="relative bg-[#FDFBF6] pt-28 pb-0 overflow-hidden">
      {/* Decorative gradient blob */}
      <Image
        src="/mastercard.png"
        alt="Background Gradient"
        width={2000}
        height={434}
        className="absolute -top-10 left-160 -translate-x-1/2 pointer-events-none select-none opacity-70 z-0"
        priority
      />

      {/* Content container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid md:grid-cols-2 gap-x-8 items-start">
        {/* Text */}
        <div className="md:col-span-1">
          <h1 className="font-accent font-bold text-5xl sm:text-6xl md:text-7xl leading-tight text-gray-900">
            Welcome to <br />
            8EH Radio ITB
          </h1>
        </div>
        {/* CTA */}
        <div className="space-y-6 md:col-span-1 md:text-left mt-8 md:mt-2">
          <p className="font-body text-base text-gray-700 max-w-sm">
            Tune in to 8EH Radio for the latest in campus news, music, and
            entertainment. Join our vibrant community and explore a world of
            creativity and fun!
          </p>
          <div className="flex items-center gap-4 justify-start">
            <ButtonPrimary
              className="!bg-[#EA4A30] !text-white hover:!bg-[#D0402A] !px-8 !py-3"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("triggerPlayerControl"))
              }
            >
              Listen
            </ButtonPrimary>
            <ButtonPrimary
              className="!bg-[#EFEAE6]/80 !text-[#444] hover:!bg-[#E5DED8] !px-8 !py-3"
              onClick={() => {}}
            >
              Join
            </ButtonPrimary>
          </div>
        </div>
      </div>

      {/* Radio Image with Fade */}
      <div className="relative -mt-36 md:-mt-60 flex justify-center">
        <Image
          src="/radio-home.png"
          alt="Radio Illustration"
          width={1200}
          height={700}
          className="[mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] mix-blend-multiply"
          priority
        />
      </div>

      {/* Sticky small player (desktop) */}
      <div className="hidden">
        <RadioPlayer compact />
      </div>
    </section>
  );
}

function PodcastSection() {
  return (
    <section className="pt-12 pb-16 bg-white relative overflow-hidden">
      {/* Background decorative blob */}
      <div className="absolute -right-1/8 -top-1/8 w-1/2 h-full z-0 pointer-events-none">
        <Image
          src="/vstock-home.png"
          alt="background decorative gradient"
          width={800}
          height={800}
          // className=""
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="font-body text-gray-500 text-sm mb-1">Listen</p>
        <h2 className="font-heading text-3xl sm:text-4xl text-gray-900 mb-6">
          Listen to Our Podcasts
        </h2>

        {/* Podcasts List */}
        <div className="space-y-4">
          {podcasts.map((pod, idx) => (
            <div
              key={idx}
              className="flex items-start gap-6 py-8 border-b border-gray-200/80 last:border-b-0"
            >
              {/* Image */}
              <div className="w-40 h-40 relative flex-shrink-0">
                <Image
                  src={pod.image}
                  alt="Podcast Thumbnail"
                  fill
                  className="object-cover rounded-xl shadow-md"
                />
              </div>
              {/* Details */}
              <div className="flex-1">
                <h3 className="font-heading text-xl text-gray-900 font-bold mb-2">
                  {pod.title}
                </h3>
                <p className="font-body text-sm text-gray-500 mb-1">
                  {pod.subtitle}
                </p>
                <p className="font-body text-base text-gray-600 mb-3">
                  {pod.description}
                </p>
                <p className="font-body text-sm text-gray-500">
                  {pod.date} &bull; {pod.duration}
                </p>
              </div>
              {/* Play Button */}
              <ButtonPrimary className="!w-14 !h-14 !rounded-full !p-0 flex items-center justify-center flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white ml-0.5"
                  fill="white"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <polygon points="6,4 20,12 6,20" fill="white" />
                </svg>
              </ButtonPrimary>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <ButtonPrimary className="!bg-gray-100 !text-gray-800 hover:!bg-gray-200 !font-medium !px-8 !py-3">
            View all
          </ButtonPrimary>
        </div>
      </div>
    </section>
  );
}

function NewsSection() {
  return (
    <section className="py-16 bg-white relative">
      <div className="absolute top-10 left-1/4 opacity-80 -translate-x-1/2">
        <Image
          src="/vstock-home1.png"
          alt="decoration"
          width={150}
          height={150}
        />
      </div>
      <div className="absolute top-10 right-1/4 opacity-80 translate-x-1/2">
        <Image
          src="/vstock-home2.png"
          alt="decoration"
          width={150}
          height={150}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="font-accent text-6xl font-bold text-gray-900 mb-2">
          Latest Campus News
        </h2>
        <p className="font-body text-gray-600 mb-16">
          Stay updated with campus happenings and insights.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-left">
          {newsItems.map((item, idx) => (
            <Link href="#" key={idx} className="block group">
              <div className="bg-gradient-to-b from-[#FEF9E7] to-[#F5E6A3] rounded-3xl shadow-sm overflow-hidden flex flex-col h-full p-4 transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:scale-[1.02]">
                <div className="relative h-48 rounded-xl overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="pt-6 px-2 flex flex-col flex-grow">
                  <p className="font-body text-sm text-gray-500 mb-2 font-medium">
                    {item.category}
                  </p>
                  <h3 className="font-heading text-xl text-gray-900 font-bold mb-3">
                    {item.title}
                  </h3>
                  <p className="font-body text-sm text-gray-600 mb-6 flex-grow">
                    {item.description}
                  </p>
                  <div className="flex items-center mt-auto">
                    <div className="w-10 h-10 relative mr-3">
                      <Image
                        src={item.authorImage}
                        alt={item.author}
                        fill
                        className="rounded-full"
                      />
                    </div>
                    <div className="flex flex-col">
                      <p className="font-body font-semibold text-sm text-gray-800">
                        {item.author}
                      </p>
                      <p className="font-body text-xs text-gray-500">
                        {item.date} &bull; {item.readTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <ButtonPrimary className="!bg-gray-200 !text-gray-800 hover:!bg-gray-300 !font-medium !px-6 !py-2.5">
            View all
          </ButtonPrimary>
        </div>
      </div>
    </section>
  );
}

function ProgramsSection() {
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
        <div className="flex justify-between items-center mb-12">
          <div className="text-left">
            <h2 className="font-heading text-lg md:text-xl text-red-600/90 mb-1">
              Discover the Vibrant World of
            </h2>
            <h3 className="font-accent text-5xl md:text-6xl font-bold text-gray-900">
              8EH Radio Programs
            </h3>
          </div>
          {/* Slider Controls */}
          <div className="hidden sm:flex items-center space-x-4">
            <button
              onClick={() => scroll("left")}
              className="w-14 h-14 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white/100 transition-colors flex items-center justify-center border border-gray-200/80 shadow-md"
              aria-label="Scroll left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-700"
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
              className="w-14 h-14 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white/100 transition-colors flex items-center justify-center border border-gray-200/80 shadow-md"
              aria-label="Scroll right"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-700"
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
          className="flex overflow-x-auto scroll-smooth space-x-6 pb-4 -mx-4 px-4 snap-x snap-mandatory hide-scrollbar"
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

function TuneTrackerSection() {
  return (
    <section className="relative py-24 bg-white text-gray-900 overflow-hidden">
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px]">
        <Image
          src="/tune-tracker.png"
          alt="Decorative turntable"
          width={900}
          height={900}
          className="w-full h-full object-contain opacity-70 mix-blend-multiply"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <h2 className="font-accent text-6xl font-bold text-gray-900 mb-2">
            Tune Tracker
          </h2>
          <p className="font-body text-gray-600 text-lg">
            Discover the Hottest Tracks: Our Top 10 Music Charts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {tunes.map((tune, idx) => (
            <div
              key={idx}
              className="flex items-center p-3 rounded-2xl bg-white/70 border border-gray-200/80 backdrop-blur-md hover:bg-gray-50/80 hover:border-gray-300 transition-all duration-300 shadow-sm"
            >
              <div className="w-8 text-center text-gray-400 font-mono font-medium">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="w-14 h-14 relative mx-4 rounded-full overflow-hidden flex-shrink-0 shadow-inner">
                <Image
                  src={tune.image}
                  alt={tune.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-grow">
                <h3 className="font-heading font-bold text-gray-800">
                  {tune.title}
                </h3>
                <p className="text-sm text-gray-500">{tune.artist}</p>
              </div>
              <button
                className="w-12 h-12 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0 border border-gray-200/90 shadow-md"
                aria-label={`Play ${tune.title}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-gray-700"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnnouncersSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl text-gray-900 mb-2">
          Our Announcers
        </h2>
        <p className="font-body text-gray-600 mb-10">
          Meet our talented radio announcers and street teams.
        </p>

        {/* BoardSlider uses its own dummy data if none provided */}
        <BoardSlider />

        <div className="mt-10">
          <ButtonPrimary>View All</ButtonPrimary>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
//  Main Page
// ---------------------------------------------------------------------------

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-white font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Sections */}
      <HeroSection />
      <PodcastSection />
      <NewsSection />
      <ProgramsSection />
      <TuneTrackerSection />
      <AnnouncersSection />

      {/* Footer */}
      <FooterSection />
    </main>
  );
}
