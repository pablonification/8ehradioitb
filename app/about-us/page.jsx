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
    </div>
  );
}
// hello vercel