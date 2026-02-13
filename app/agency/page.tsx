'use client'
import Image from 'next/image'
import Navbar from '@/app/components/Navbar' // Reusing the Navbar component
import ButtonPrimary from '@/app/components/ButtonPrimary' // Reusing the Button component
import FooterSection from '../components/FooterSection'
import BoardSliderAnnouncerAgency from '../components/BoardSliderAnnouncerAgency'
import BoardSliderReporter from '../components/BoardSliderReporter'
import BoardSliderMarketing from '../components/BoardSliderMarketing'
import type { ReactNode } from 'react'

// Komponen Ikon Sosial Media (untuk kebersihan kode)
const SocialIcon = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-gray-800 transition-colors hover:text-black"
  >
    {children}
  </a>
)

const LinkedInIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
)

const TwitterIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

const MailIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
)

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
)

const AnnouncerCard = ({
  name,
  role,
  imageSrc,
}: {
  name: string
  role: string
  imageSrc: string
}) => (
  <div className="transform overflow-hidden rounded-xl text-center transition-transform duration-300 hover:-translate-y-1">
    <div className="relative h-80 w-full">
      <Image src={imageSrc} alt={name} layout="fill" objectFit="cover" className="rounded-xl" />
    </div>
    <div className="p-5">
      <h3 className="text-xl font-bold text-black">{name}</h3>
      <p className="text-gray-800">{role}</p>
      <div className="mt-4 flex items-center justify-center space-x-3">
        <SocialIcon href="#">
          <LinkedInIcon />
        </SocialIcon>
        <SocialIcon href="#">
          <TwitterIcon />
        </SocialIcon>
        <SocialIcon href="#">
          <InstagramIcon />
        </SocialIcon>
      </div>
    </div>
  </div>
)

const HeroSection = () => (
  <section className="relative flex min-h-150 w-full items-center justify-center overflow-hidden px-4 pb-20 sm:px-6 md:min-h-[500px] md:pb-0 lg:px-28">
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-none absolute right-0 bottom-0 z-0 w-140 translate-x-1/3 md:top-1/8 md:w-300">
        <Image
          src="/sun-agency.png"
          alt="background decorative gradient"
          width={800}
          height={800}
        />
      </div>
      <div className="absolute inset-0 top-3/4 left-1/8 h-36 w-36 opacity-70 md:left-1/4">
        <Image
          src="/vstock-aboutus-2.svg"
          alt="decorative"
          width={96}
          height={96}
          className="rotate-225"
        />
      </div>
      <div className="absolute inset-0 top-1/8 left-[4%] h-20 w-16 opacity-70 md:w-20">
        <Image src="/vstock-aboutus-1.svg" width={80} height={80} alt="decorative" />
      </div>
      <div className="absolute inset-0 top-1/6 left-3/4 h-24 w-12 translate-x-1/2 opacity-70 md:top-1/8 md:left-1/2 md:w-24">
        <Image src="/vstock-aboutus-3.svg" width={112} height={112} alt="decorative" />
      </div>
    </div>

    <div className="relative z-20 grid max-w-7xl grid-cols-1 items-center gap-8 px-4 md:mx-0 lg:grid-cols-2">
      <div className="text-left">
        <h1 className="font-accent text-6xl text-wrap text-gray-900 md:text-7xl lg:text-8xl">
          8EH Agency Services
        </h1>
        <p className="font-body mt-6 max-w-lg text-base text-gray-700 md:text-xl">
          Temukan talenta profesional untuk memeriahkan acaramu dengan pembawaan yang menarik dan
          penuh energi!
        </p>
      </div>
      <div className="absolute top-0 right-0 translate-x-1/8 translate-y-1/2 justify-center lg:translate-x-0 lg:-translate-y-1/16 lg:justify-end">
        <div
          className="flex h-100 w-50 scale-x-[-1] items-baseline justify-center lg:w-100"
          style={{
            filter: 'grayscale(100%) contrast(1.5)',
          }}
        >
          <Image
            src="/megaphone.png"
            alt="Hand holding a megaphone"
            width={400}
            height={350}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  </section>
)

const AnnouncerServicesSection = () => (
  <section className="relative overflow-hidden bg-white from-white via-[#c59402] to-white pt-40">
    <div className="absolute inset-0 top-1/12 left-0 z-50 h-60 w-30 md:top-0 md:w-60">
      <Image src="/vstock-agency-4.png" alt="Decorative Star" width={200} height={200} />
    </div>

    <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-8 rounded-3xl border border-gray-200/80 from-orange-200 to-orange-400/70 px-10 py-6 backdrop-blur-xs transition-all duration-300 hover:border-gray-300 md:grid-cols-2 md:bg-gradient-to-b md:px-16 md:shadow-lg">
        <div>
          <h2 className="font-accent align-middle text-5xl leading-tight text-black md:text-6xl">
            Professional <br /> Announcer Services
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex items-start space-x-4">
            <div>
              <Image
                src="/handshake.png"
                alt="Handshake Icon"
                width={48}
                height={48}
                className="mb-4"
              />
              <h3 className="font-body mb-2 text-lg font-semibold text-black">
                Kenapa 8EH Agency?
              </h3>
              <p className="font-body text-sm text-black">
                Talenta kami berpengalaman, atraktif, dan siap tampil sesuai dengan tema acara Anda.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div>
              <Image src="/people.png" alt="People Icon" width={48} height={48} className="mb-4" />
              <h3 className="font-body mb-2 text-lg font-semibold text-black">Talent Kami</h3>
              <p className="font-body text-sm text-black">
                Kenalan dengan tim kami yang penuh warna—kumpulan announcer, reporter, dan desainer
                grafis berbakat!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      aria-hidden="true"
      className="absolute top-7/8 right-0 z-20 w-30 -translate-y-1/2 rotate-180 md:w-50"
    >
      <Image src="/vstock-agency-1.png" alt="Decorative Checkmark" width={240} height={240} />
    </div>

    <div className="relative z-0 mt-4 w-full justify-center">
      <div
        className="relative flex w-full justify-center"
        style={{
          filter: 'grayscale(100%) contrast(1.2)',
        }}
      >
        {/* Lapisan putih transparan */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-white/70 to-white"></div>

        {/* Gambar itu sendiri */}
        <Image
          src="/group-microphone.png"
          alt="A group of microphones with a halftone effect"
          width={1920}
          height={1080}
          className="h-auto w-200 object-cover"
        />
      </div>
    </div>
  </section>
)

const AnnouncersSection = () => (
  <section className="bg-gradient-to-b from-orange-400 via-orange-300 to-orange-200 pb-12 text-gray-800">
    {/* <Image
        src="/agency-white-transition.png"
        alt="A group of microphones with a halftone effect"
        width={1920}
        height={1080}
        className="object-fit w-full h-4 md:h-10"
      /> */}
    <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="font-accent mb-4 text-5xl font-bold text-white drop-shadow-md sm:text-7xl">
          Announcers
        </h2>
        {/* <ButtonPrimary className="!px-4 !py-2 mt-4 !pointer-events-none">
          Announcers
        </ButtonPrimary> */}
      </div>
      <BoardSliderAnnouncerAgency />
    </div>
  </section>
)
const ReporterSection = () => (
  <section className="bg-gradient-to-b from-orange-400 via-orange-300 to-orange-200 pb-12 text-gray-800">
    {/* <Image
        src="/agency-white-transition.png"
        alt="A group of microphones with a halftone effect"
        width={1920}
        height={1080}
        className="object-fit w-full h-4 md:h-10"
      /> */}
    <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="font-accent mb-4 text-5xl font-bold text-white drop-shadow-md sm:text-7xl">
          Reporters & Video Editors
        </h2>
        {/* <ButtonPrimary className="!px-4 !py-2 mt-4 !pointer-events-none">
          Reporters & Video Editors
        </ButtonPrimary> */}
      </div>
      <BoardSliderReporter />
    </div>
  </section>
)

const MarketingSection = () => (
  <section className="bg-gradient-to-b from-orange-400 via-orange-300 to-orange-200 pb-12 text-gray-800">
    {/* <Image
        src="/agency-white-transition.png"
        alt="A group of microphones with a halftone effect"
        width={1920}
        height={1080}
        className="object-fit w-full h-4 md:h-10"
      /> */}
    <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="font-accent mb-4 text-5xl font-bold text-white drop-shadow-md sm:text-7xl">
          Graphic Designers
        </h2>
        {/* <ButtonPrimary className="!px-4 !py-2 mt-4 !pointer-events-none">
          Graphic Designers
        </ButtonPrimary> */}
      </div>
      <BoardSliderMarketing />
    </div>
  </section>
)

const ContactSection = () => (
  <section className="relative w-full overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8">
    {/* Elemen Grafis Latar Belakang */}
    <div aria-hidden="true" className="absolute top-1/2 left-0 w-30 -translate-y-1/2 md:w-50">
      <Image src="/vstock-agency-1.png" alt="Decorative Checkmark" width={240} height={240} />
    </div>
    <div aria-hidden="true" className="absolute top-0 right-0 z-40 w-30 md:w-50">
      <Image src="/vstock-agency-2.png" alt="Decorative Checkmark" width={240} height={240} />
    </div>

    {/* Konten Utama */}
    <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-2">
      {/* Kolom Kiri: Teks */}
      <div className="text-center md:text-left">
        <h2 className="font-serif text-5xl tracking-tight text-gray-800 md:text-6xl">
          Get in Touch
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-gray-600 md:mx-0">
          We're here to answer your questions and discuss partnership opportunities. Reach out
          today!
        </p>
      </div>

      {/* Kolom Kanan: Kartu Kontak */}
      <div className="mx-auto w-full max-w-md">
        <div className="shadow-subtle rounded-3xl border border-gray-200/60 bg-gradient-to-b from-[#ffeebb] to-[#ffbf00b7] p-8 drop-shadow-md backdrop-blur-sm transition-all duration-300 hover:border-gray-300">
          <div className="flex items-start gap-5">
            <MailIcon className="mt-1 h-6 w-6 flex-shrink-0 text-gray-700" />
            <div>
              <h3 className="text-lg font-bold text-gray-800">Email</h3>
              <a
                href="mailto:8eh_itb@km.itb.ac.id"
                className="text-gray-600 underline underline-offset-4 transition-colors hover:text-black"
              >
                8eh_itb@km.itb.ac.id
              </a>
            </div>
          </div>
          <div className="mt-8 flex items-start gap-5">
            <MapPinIcon className="mt-1 h-6 w-6 flex-shrink-0 text-gray-700" />
            <div>
              <h3 className="text-lg font-bold text-gray-800">Office</h3>
              <p className="text-gray-600">Jl. Ganesha No. 10, Bandung, 40132, Indonesia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

export default function AgencyServicesPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <HeroSection />
      <AnnouncerServicesSection />
      <AnnouncersSection />
      <ReporterSection />
      <MarketingSection />
      <ContactSection />
      <FooterSection />
    </div>
  )
}
