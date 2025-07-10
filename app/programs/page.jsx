"use client";
import Image from "next/image";
import Navbar from "../components/Navbar";
import ProgramHero from "../components/ProgramHero";
import PodcastSection from "../components/PodcastSection";
import HighlightsSection from "../components/HighlightsSection";
import FooterSection from "../components/FooterSection";

// Data dummy untuk podcast
const podcasts = [
  {
    title: "Dulu VS Sekarang | Gather With Us Special Podcast",
    category: "GWS Special",
    imageUrl: "/images/placeholder.svg",
  },
  {
    title: "Vibes of GWS! | Gather With Us #23",
    category: "Vibes of GWS!",
    imageUrl: "/images/placeholder.svg",
  },
  {
    title: "#8EH2GETHER | Hias Kue Ultah ke-12 8EH!",
    category: "ON AIR",
    imageUrl: "/images/placeholder.svg",
  },
];

const YoutubeCTA = () => {
  return (
    // Section wrapper untuk memberikan spasi atas dan bawah
    <section className="relative py-16">
      <div className="absolute top-0 left-0 w-30 h-30 opacity-70">
        <Image
          src="/vstock-programs-12.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/2 right-0 w-30 h-30 opacity-70">
        <Image
          src="/vstock-programs-13.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      {/* Container utama yang mengatur layout dan styling */}
      <div className="flex flex-col md:flex-row items-center justify-between mx-8 md:mx-24 rounded-4xl bg-gradient-to-br from-white/70 to-yellow-300/30 backdrop-blur-sm py-8 px-8 transition-all duration-300 border hover:border-gray-300 border-gray-200/50">
        {/* Sisi Kiri: Teks Ajakan */}
        <div className="text-center md:text-left mb-6 md:mb-0">
          <h2 className="text-4xl md:text-6xl font-semibold md:font-normal font-accent text-gray-800 mb-1">
            Join Us on Youtube
          </h2>
          <p className="text-gray-600 max-w-md font-body mt-4">
            Experience the vibrant sounds of 8EH Radio ITB Podcasts by visiting
            our Youtube Channel
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
  );
};

export default function Home() {
  return (
    <main className="bg-[#FFF6F4] overflow-x-hidden font-sans">
      <Navbar />

      <ProgramHero />
      <PodcastSection />
      <HighlightsSection />
      <YoutubeCTA />
      <FooterSection />
    </main>
  );
}
