"use client";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import ButtonPrimary from "@/app/components/ButtonPrimary";
import { useState } from "react";

export default function AboutUs() {
  const [selectedYear, setSelectedYear] = useState('1963');
  
  const timelineContent = {
    '1963': "8EH Radio ITB was founded to create a vibrant platform for students to express their creativity and connect with the campus community. Our mission is to deliver engaging content that informs, entertains, and resonates with the voices of ITB.",
    '1978': "Placeholder untuk sejarah tahun 1978.", 
    '1980': "Placeholder untuk sejarah tahun 1980.",
    '1982': "Placeholder untuk sejarah tahun 1982."
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Component */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/sun-gradient.png)",
          }}
        ></div>

        {/* Decorative Shapes */}
        <div className="absolute inset-0">
          {/* Top left shape */}
          <div className="absolute top-90 left-30 w-48 h-48">
            <Image
              src="/vstock-aboutus-1.svg"
              alt="About Us"
              width={192}
              height={192}
            />
          </div>
          {/* Top right shape */}
          <div className="absolute top-32 right-20 w-56 h-56">
            <Image
              src="/vstock-aboutus-3.svg"
              alt="About Us"
              width={192}
              height={192}
            />
          </div>
          {/* Bottom left shape */}
          <div className="absolute bottom-40 left-10 w-48 h-48">
            <Image
              src="/vstock-aboutus-2.svg"
              alt="About Us"
              width={192}
              height={192}
            />
          </div>
          {/* Bottom right shape */}
          <div className="absolute bottom-20 right-32 w-52 h-52">
            <Image
              src="/vstock-aboutus-4.svg"
              alt="About Us"
              width={192}
              height={192}
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-screen flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mb-8">
              <span className="inline-block text-white px-4 py-2 rounded-full text-base font-body font-bold mb-6">
                About Us
              </span>
            </div>
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-accent font-bold mb-6">
              8EH Radio ITB
            </h1>
            <p className="text-base md:text-lg font-body max-w-3xl mx-auto mb-8 text-white/90">
              Connecting the ITB community through engaging content, creativity,
              and collaboration in media.
            </p>
            <ButtonPrimary>
              Learn More
            </ButtonPrimary>
          </div>
        </div>

        {/* Enhanced fade out to white */}
        <div
          className="absolute bottom-0 inset-x-0 pointer-events-none"
          style={{
            height: "40vh",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.9) 75%, #ffffff 100%)",
          }}
        />
      </section>

      {/* Our Journey Section */}
      <section className="relative py-20 overflow-hidden -mt-40">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-red-50 to-yellow-100"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Microphone Image */}
            <div className="relative">
              <div className="w-full max-w-lg mx-auto">
                <Image
                  src="/mic-vstock.png"
                  alt="About Us"
                  width={1024}
                  height={1024}
                />
              </div>
            </div>

            {/* Right side - Content */}
            <div>
            <div className="absolute w-full max-w-lg mx-auto -top-20 -right-40 -z-10">
                <Image
                  src="/vstock-3.png"
                  alt="About Us"
                  width={395}
                  height={395}
                  className="object-contain"
                />
              </div>
              <h2 className="text-5xl md:text-6xl font-heading font-bold text-gray-900 mb-4">
                Our Journey
              </h2>
              <h3 className="text-2xl md:text-3xl font-accent text-red-600 mb-8">
                Passion for Campus Broadcasting
              </h3>

              {/* Timeline */}
              <div className="flex space-x-6 mb-8">
                <ButtonPrimary 
                  onClick={() => setSelectedYear('1963')}
                  className={selectedYear === '1963' ? 'ring-2 ring-white ring-opacity-50' : ''}
                >
                  1963
                </ButtonPrimary>
                <ButtonPrimary 
                  onClick={() => setSelectedYear('1978')}
                  className={selectedYear === '1978' ? 'ring-2 ring-white ring-opacity-50' : ''}
                >
                  1978
                </ButtonPrimary>
                <ButtonPrimary 
                  onClick={() => setSelectedYear('1980')}
                  className={selectedYear === '1980' ? 'ring-2 ring-white ring-opacity-50' : ''}
                >
                  1980
                </ButtonPrimary>
                <ButtonPrimary 
                  onClick={() => setSelectedYear('1982')}
                  className={selectedYear === '1982' ? 'ring-2 ring-white ring-opacity-50' : ''}
                >
                  1982
                </ButtonPrimary>
              </div>

              {/* Description */}
              <p className="text-gray-700 font-body text-lg leading-relaxed">
                {timelineContent[selectedYear]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Management Board Section */}
      <section className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-5xl md:text-6xl font-accent font-bold text-gray-900 mb-12 uppercase tracking-wide">
            Management Board
          </h2>

          <p className="text-center max-w-2xl mx-auto mb-16 text-gray-600 font-body">
            Meet the passionate individuals behind 8EH Radio ITB.
          </p>

          {/* Board Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-4">
                {/* Avatar placeholder */}
                <div className="w-36 h-36 rounded-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 font-body">Photo</span>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-gray-900">Alex Johnson</h3>
                  <p className="font-body text-sm text-gray-500">Lead Announcer</p>
                </div>
                <p className="font-body text-sm text-gray-600 px-4">
                  With a great passion for radio, Alex is dedicated to engaging with the audience and sharing compelling stories.
                </p>
                {/* Social Icons */}
                <div className="flex space-x-4">
                  {/* Using placeholder SVGs so they can be replaced later */}
                  {['/globe.svg', '/file.svg', '/next.svg'].map((icon, i) => (
                    <a key={i} href="#" className="w-4 h-4 text-gray-500 hover:text-gray-800 transition-colors">
                      <Image src={icon} alt="icon" width={16} height={16} />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discover Section */}
      <section className="relative py-24 bg-gradient-to-b from-white via-yellow-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-gray-900 mb-4 text-center">
            Discover the vibrant world of 8EH Radio ITB and its offerings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              {
                title: 'Creating engaging content for the ITB community and beyond',
                cta: 'Learn More',
              },
              {
                title: 'Our broadcasting process: From concept to airwaves, we make it happen',
                cta: 'Join Us',
              },
              {
                title: 'Engage with our community through live shows and interactive content',
                cta: 'Listen',
              },
            ].map((item, idx) => (
              <div key={idx} className="relative rounded-2xl bg-[#FBEAEA] p-8 min-h-[250px] flex flex-col justify-between shadow">
                {/* Placeholder for card image */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Img</span>
                </div>

                <p className="mt-10 font-body text-sm text-gray-700 leading-relaxed">
                  {item.title}
                </p>

                <div className="mt-6">
                  <ButtonPrimary className="px-6 py-2 text-sm">
                    {item.cta} &rarr;
                  </ButtonPrimary>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Voices Section */}
      <section className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-gray-900 mb-12 text-center">
            Student Voices
          </h2>

          <p className="text-center font-body text-gray-600 max-w-xl mx-auto mb-16">
            8EH Radio ITB has transformed our campus experience.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[
              {
                quote:
                  '“8EH Radio is a vibrant platform that connects students and alumni, fostering creativity and collaboration.”',
                name: 'Fina Hermawan',
                role: 'Alumnus',
              },
              {
                quote:
                  '“The programs offered by 8EH Radio have enriched our campus culture and provided invaluable experiences for students.”',
                name: 'Andi Prasetyo',
                role: 'Student',
              },
            ].map((t, idx) => (
              <div key={idx} className="bg-[#FBEAEA] p-8 rounded-2xl shadow">
                {/* Stars */}
                <div className="flex space-x-1 mb-4">
                  {[...Array(5)].map((_, starIdx) => (
                    <svg
                      key={starIdx}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="#F59E0B"
                      className="w-5 h-5"
                    >
                      <path d="M9.049 2.927C9.348 2.021 10.652 2.021 10.951 2.927l1.286 3.971a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.39 2.463a1 1 0 00-.364 1.118l1.288 3.972c.3.906-.755 1.657-1.54 1.118l-3.39-2.463a1 1 0 00-1.175 0l-3.39 2.463c-.784.539-1.838-.212-1.539-1.118l1.288-3.972a1 1 0 00-.364-1.118L2.045 9.398c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.951-.69l1.285-3.971z" />
                    </svg>
                  ))}
                </div>

                <p className="font-body text-gray-700 italic mb-6">{t.quote}</p>
                <div className="font-heading font-semibold text-gray-900">
                  {t.name}
                </div>
                <div className="font-body text-sm text-gray-500">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get in Touch Section */}
      <section className="relative py-24 bg-gradient-to-b from-white via-yellow-100 to-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-gray-900 mb-12 text-center">
            Get in Touch
          </h2>

          <p className="text-center font-body text-gray-600 max-w-xl mx-auto mb-16">
            We'd love to hear from you! Reach out for inquiries or collaborations.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Contact details */}
            <div className="space-y-6">
              <div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Email</h3>
                <p className="font-body text-gray-700">hello@8ehradioitb.com</p>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Phone</h3>
                <p className="font-body text-gray-700">+62 877 1234 5678</p>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Office</h3>
                <p className="font-body text-gray-700">Jl. Ganesa No. 11, Bandung, Indonesia</p>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="lg:col-span-2 rounded-3xl overflow-hidden bg-gray-200 h-96 flex items-center justify-center">
              <span className="font-body text-gray-500">Map Placeholder</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}