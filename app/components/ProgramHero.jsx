// app/components/ProgramHero.jsx

"use client"; // Diperlukan karena slider menggunakan state dan event browser

import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import Link from "next/link";

// Impor CSS dasar Swiper (Sangat Penting!)
import "swiper/css";

// Data dummy untuk program. Anda bisa mengambil ini dari API nantinya.
const programs = [
  {
    logo: "/gws-logo.png", // Logo dari gambar
    title: "GWS: Gather With Us",
    description:
      "Gather With Us adalah program bincang-bincang santai membahas topik seputar kehidupan mahasiswa dan tren terkini.",
    link: "/programs/gws",
  },
  {
    logo: "/gws-logo.png", // Contoh program lain
    title: "Program On Air",
    description:
      "Menemani harimu dengan musik-musik terbaik dan informasi terupdate langsung dari studio 8EH Radio ITB.",
    link: "/programs/on-air",
  },
  {
    logo: "/gws-logo.png", // Contoh program lain
    title: "8EH Podcast",
    description:
      "Berbagai siniar dengan pembahasan mendalam mulai dari teknologi, seni, hingga pengembangan diri.",
    link: "/programs/podcast",
  },
];

const ProgramHero = () => {
  return (
    <section className="py-16 overflow-hidden">
      <div className="absolute inset-0 top-1/8 left-0 w-40 md:w-60 opacity-70">
        <Image
          src="/vstock-programs-1.png"
          alt="Decorative Checkmark"
          width={300}
          height={300}
          className=""
        />
      </div>
      <div className="absolute top-1/4 right-0 w-40 md:w-80 opacity-30">
        <Image
          src="/vstock-programs-2.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-1/4 right-0 w-30 md:w-60 opacity-30">
        <Image
          src="/vstock-programs-3.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-5/8 left-0 w-40 md:w-60 opacity-70">
        <Image
          src="/vstock-programs-4.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="absolute top-11/16 left-0 w-30 md:w-50 opacity-70">
        <Image
          src="/vstock-programs-5.png"
          alt="Decorative Checkmark"
          width={600}
          height={600}
          className=""
        />
      </div>
      <div className="container mx-auto">
        <h2 className="text-6xl font-accent text-center text-gray-800 mb-12">
          Our Programs
        </h2>

        <Swiper
          // Konfigurasi untuk menampilkan 1 slide penuh dan sedikit slide berikutnya
          slidesPerView={1.2}
          spaceBetween={20} // Jarak antar slide
          centeredSlides={true} // Slide aktif akan berada di tengah
          loop={false} // Slider akan berputar tanpa henti
          breakpoints={{
            // Konfigurasi untuk layar yang lebih besar
            768: {
              slidesPerView: 1.3,
              spaceBetween: 30,
            },
            1024: {
              slidesPerView: 1.3,
              spaceBetween: 40,
            },
          }}
          className="!overflow-visible" // Agar shadow tidak terpotong
        >
          {programs.map((program, index) => (
            <SwiperSlide key={index}>
              <div className="bg-gradient-to-br backdrop-blur-xs from-orange-600/80 via-yellow-500/50 to-yellow-100/30 rounded-3xl px-8 lg:px-20 pt-8 md:pt-16 pb-8 shadow-xl h-80 flex flex-col justify-between overflow-hidden transition-all duration-300 border hover:border-gray-400 border-gray-200/80">
                <div className="flex flex-wrap md:flex-nowrap items-center justify-center space-x-4 md:space-x-16">
                  <div className="flex-shrink-0 mb-4 w-40 md:w-65 lg:w-75">
                    <Image
                      src={program.logo}
                      alt={`${program.title} logo`}
                      width={300}
                      height={300}
                      className="drop-shadow-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-800">
                      {program.title}
                    </h3>
                    <p className="text-gray-700 text-xs lg:text-sm mt-1">
                      {program.description}
                    </p>
                  </div>
                </div>
                <Link
                  href={program.link}
                  className="self-end text-red-600 hover:text-red-800 font-semibold text-sm flex items-center"
                >
                  View More
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
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default ProgramHero;
