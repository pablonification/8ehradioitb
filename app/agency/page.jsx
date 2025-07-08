"use client";
import Image from "next/image";
import Navbar from "@/app/components/Navbar"; // Reusing the Navbar component
import ButtonPrimary from "@/app/components/ButtonPrimary"; // Reusing the Button component
import FooterSection from "../components/FooterSection";

// Data untuk anggota tim agar mudah dikelola
const announcerTeam = [
  {
    name: "Julienne",
    role: "Announcer",
    imageSrc: "/announcer-1.jpg", // Ganti dengan path gambar yang benar
  },
  {
    name: "Hamzah",
    role: "Event Host",
    imageSrc: "/announcer-1.jpg", // Ganti dengan path gambar yang benar
  },
  {
    name: "Nadh",
    role: "Announcer",
    imageSrc: "/announcer-1.jpg", // Ganti dengan path gambar yang benar
  },
  {
    name: "Wanda", // Nama dari gambar ke-4
    role: "Content Creator", // Contoh role
    imageSrc: "/announcer-1.jpg", // Ganti dengan path gambar yang benar
  },
];

// Komponen Ikon Sosial Media (untuk kebersihan kode)
const SocialIcon = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-gray-800 hover:text-black transition-colors"
  >
    {children}
  </a>
);

const LinkedInIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const TwitterIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className }) => (
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
);

const MailIcon = ({ className }) => (
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
);

const MapPinIcon = ({ className }) => (
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
);

export const AnnouncerCard = ({ name, role, imageSrc }) => (
  <div className="rounded-xl  overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 text-center">
    <div className="relative h-80 w-full">
      <Image
        src={imageSrc}
        alt={name}
        layout="fill"
        objectFit="cover"
        className="rounded-xl"
      />
    </div>
    <div className="p-5">
      <h3 className="text-xl font-bold text-black">{name}</h3>
      <p className="text-gray-800">{role}</p>
      <div className="flex items-center justify-center space-x-3 mt-4">
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
);

export const HeroSection = () => (
  <section className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-28">
    <div className="absolute inset-0 z-10 pointer-events-none">
      <div className="absolute right-0 top-1/8 w-1/2 h-full z-0 pointer-events-none">
        <Image
          src="/sun-agency.png"
          alt="background decorative gradient"
          width={800}
          height={800}
        />
      </div>
      <div className="absolute inset-0 top-3/4 left-1/4 w-36 h-36 opacity-70">
        <Image
          src="/vstock-aboutus-2.svg"
          alt="Decorative Checkmark"
          width={96}
          height={96}
          className="rotate-225"
        />
      </div>
      <div className="absolute inset-0 top-1/8 left-[4%] w-20 h-20 opacity-70">
        <Image
          src="/vstock-aboutus-1.svg"
          alt="Decorative Star"
          width={80}
          height={80}
        />
      </div>
      <div className="absolute inset-0 top-1/8 left-1/2 translate-x-1/2 w-24 h-24 opacity-70">
        <Image
          src="/vstock-aboutus-3.svg"
          alt="Decorative Arrow"
          width={112}
          height={112}
        />
      </div>
    </div>

    <div className="relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-7xl mx-auto">
      <div className="text-left">
        <h1 className="text-6xl text-nowrap font-accent md:text-7xl lg:text-8xl text-gray-900 leading-tight">
          8EH Agency Services
        </h1>
        <p className="mt-6 text-base font-body md:text-xl text-gray-700 max-w-lg">
          Discover professional talent to elevate your events with engaging and
          dynamic presentations.
        </p>
      </div>
      <div className="absolute right-0 bottom-[-60%] justify-center lg:justify-end">
        <div
          className="w-[400px] h-[350px] m flex items-baseline justify-center scale-x-[-1]"
          style={{
            filter: "grayscale(100%) contrast(1.5)",
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
);

export const AnnouncerServicesSection = () => (
  <section className="relative pt-40 bg-gradient-to-b from-white via-[#b88a00] to-white overflow-hidden">
    <div className="absolute inset-0 top-0 left-0 z-50 w-60 h-60 ">
      <Image
        src="/vstock-agency-4.png"
        alt="Decorative Star"
        width={200}
        height={200}
      />
    </div>
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-t from-[#FF9904] to-orange-200 bg-opacity-90 rounded-[50px] shadow-xl px-10 py-6 md:px-16 grid md:grid-cols-2 gap-8 items-center z-20">
        <div>
          <h2 className="align-middle text-6xl font-accent text-gray-900 leading-tight">
            Professional <br /> Announcer Services
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-4">
            <div>
              <Image
                src="/handshake.png"
                alt="Decorative Star"
                width={48}
                height={48}
                className="mb-4"
              />
              <h3 className="text-lg font-body font-semibold text-gray-800 mb-2">
                Why Choose Us
              </h3>
              <p className="text-gray-700 font-body text-sm">
                Our announcers are experienced, engaging, and tailored to fit
                your event's theme.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div>
              <Image
                src="/people.png"
                alt="Decorative Star"
                width={48}
                height={48}
                className="mb-4"
              />
              <h3 className="text-lg font-body font-semibold text-gray-800 mb-2">
                Our Talent
              </h3>
              <p className="text-gray-700 font-body text-sm">
                Meet our diverse team of talented announcers ready to make your
                event unforgettable.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex justify-center z-0">
        <div
          className="w-full mt-8 justify-center"
          style={{
            filter: "grayscale(100%) contrast(1.2)",
          }}
        >
          <Image
            src="/group-microphone.png"
            alt="A group of microphones with a halftone effect"
            width={1000}
            height={600}
            className="object-cover object-top w-full h-80"
          />
        </div>
      </div>
    </div>
    <div className="absolute z-10 bottom-0 inset-0 bg-linear-to-b from-transparent via-transparent via-40% to-white" />
  </section>
);

export const AnnouncerTeamSection = () => (
  <section className="relative bg-gradient-to-b from-[#f1281ed7] via-[#FF9904] to-white overflow-hidden">
    <Image
      src="/agency-white-transition.png" // Replace with the actual path to your microphone group image
      alt="A group of microphones with a halftone effect"
      width={1000}
      height={600}
      className="w-full pb-12"
    />

    <div className="max-w-5xl mx-auto">
      <h2 className="text-4xl md:text-6xl font-accent text-white text-center mt-10 mb-20">
        Our Announcer Team
      </h2>
      {/* Decorative Stars */}
      <div className="absolute left-0 top-1/8 w-1/2 h-full z-0 pointer-events-none">
        <Image
          src="/vstock-agency-3.png"
          alt="background decorative gradient"
          width={96}
          height={96}
        />
      </div>
      <div className="absolute right-0 top-1/12 h-full z-0 pointer-events-none">
        <Image
          src="/vstock-agency-3.png"
          alt="background decorative gradient"
          width={96}
          height={96}
          className="rotate-30"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {announcerTeam.map((member) => (
          <AnnouncerCard
            key={member.name}
            name={member.name}
            role={member.role}
            imageSrc={member.imageSrc}
          />
        ))}
      </div>
    </div>
    {/* View All Button */}
    <div className="text-center mt-12 pb-12">
      <ButtonPrimary className="!bg-gray-300 !text-gray-800 hover:!bg-gray-200 !font-bold !px-8 !py-3">
        View all
      </ButtonPrimary>
    </div>
  </section>
);

export const ContactSection = () => (
  <section className="relative w-full bg-[#FBF9F4] py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
    {/* Elemen Grafis Latar Belakang */}
    <div
      aria-hidden="true"
      className="absolute top-1/2 left-0 -translate-y-1/2"
    >
      <Image
        src="/vstock-agency-1.png"
        alt="Decorative Checkmark"
        width={240}
        height={240}
      />
    </div>
    <div aria-hidden="true" className="absolute z-40 top-0 right-0">
      <Image
        src="/vstock-agency-2.png"
        alt="Decorative Checkmark"
        width={240}
        height={240}
      />
    </div>

    {/* Konten Utama */}
    <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      {/* Kolom Kiri: Teks */}
      <div className="text-center md:text-left">
        <h2 className="font-serif text-5xl md:text-6xl text-gray-800 tracking-tight">
          Get in Touch
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-md mx-auto md:mx-0">
          We're here to answer your questions and discuss partnership
          opportunities. Reach out today!
        </p>
      </div>

      {/* Kolom Kanan: Kartu Kontak */}
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gradient-to-b from-[#ffeebb] to-[#ffbf00b7] backdrop-blur-sm rounded-3xl p-8 shadow-subtle">
          <div className="flex items-start gap-5">
            <MailIcon className="w-6 h-6 text-gray-700 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg text-gray-800">Email</h3>
              <a
                href="mailto:partners@8eh.com"
                className="text-gray-600 hover:text-black transition-colors underline underline-offset-4"
              >
                partners@8eh.com
              </a>
            </div>
          </div>
          <div className="mt-8 flex items-start gap-5">
            <MapPinIcon className="w-6 h-6 text-gray-700 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg text-gray-800">Office</h3>
              <p className="text-gray-600">
                Jl. Ganesha No. 10, Bandung, 40132, Indonesia
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default function AgencyServicesPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <HeroSection />
      <AnnouncerServicesSection />
      <AnnouncerTeamSection />
      <ContactSection />
      <FooterSection />
    </div>
  );
}
