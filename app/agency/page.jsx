"use client";
import Image from "next/image";
import Navbar from "@/app/components/Navbar"; // Reusing the Navbar component
import ButtonPrimary from "@/app/components/ButtonPrimary"; // Reusing the Button component

export default function AgencyServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Component */}
      <Navbar />
      {/* Hero Section */}
      <section className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-28">
        {/* Background Gradient */}
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-right-bottom bg-size-[50%] bg-no-repeat"
          style={{
            backgroundImage: "url(/ellipsss.png)",
          }}
        ></div>

        {/* Decorative Dithered Shapes */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-[15%] left-[5%] w-36 h-36 opacity-70">
            <Image
              src="/vstock-aboutus-2.svg" // Placeholder for your dithered checkmark icon
              alt="Decorative Checkmark"
              width={96}
              height={96}
            />
          </div>
          <div className="absolute top-[15%] right-[35%] w-20 h-20 opacity-70">
            <Image
              src="/vstock-aboutus-1.svg" // Placeholder for your dithered star icon
              alt="Decorative Star"
              width={80}
              height={80}
            />
          </div>
          <div className="absolute bottom-[10%] left-[30%] w-24 h-24 opacity-70">
            <Image
              src="/vstock-aboutus-3.svg" // Placeholder for your dithered arrow icon
              alt="Decorative Arrow"
              width={112}
              height={112}
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-7xl mx-auto">
          {/* Left Side: Text Content */}
          <div className="text-left">
            <h1 className="text-6xl text-nowrap font-accent md:text-7xl lg:text-8xl text-gray-900 leading-tight">
              8EH Agency Services
            </h1>
            <p className="mt-6 text-base font-body md:text-xl text-gray-700 max-w-lg">
              Discover professional talent to elevate your events with engaging
              and dynamic presentations.
            </p>
          </div>

          {/* Right Side: Image */}
          <div className="absolute right-0 bottom-[-60%] justify-center lg:justify-end">
            <div
              className="w-[400px] h-[350px] m flex items-baseline justify-center scale-x-[-1]"
              style={{
                filter: "grayscale(100%) contrast(1.5)",
              }}
            >
              <Image
                src="/megaphone.png" // Replace with the actual path to your megaphone image
                alt="Hand holding a megaphone"
                width={400}
                height={350}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Professional Announcer Services Section */}
      <section className="relative py-20 bg-gradient-to-b from-white via-orange-300 to-white overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-t from-[#FF9904] to-orange-200 bg-opacity-90 rounded-[50px] shadow-xl px-10 py-6 md:px-16 grid md:grid-cols-2 gap-8 items-center">
            {/* Left Side: Title */}
            <div>
              <h2 className="align-middle text-6xl font-accent text-gray-900 leading-tight">
                Professional <br /> Announcer Services
              </h2>
            </div>
            {/* Right Side: Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Why Choose Us */}
              <div className="flex items-start space-x-4">
                <div>
                  <h3 className="text-lg font-body font-semibold text-gray-800 mb-1">
                    Why Choose Us
                  </h3>
                  <p className="text-gray-700 font-body text-sm">
                    Our announcers are experienced, engaging, and tailored to
                    fit your event's theme.
                  </p>
                </div>
              </div>
              {/* Our Talent */}
              <div className="flex items-start space-x-4">
                <div>
                  <h3 className="text-lg font-body font-semibold text-gray-800 mb-1">
                    Our Talent
                  </h3>
                  <p className="text-gray-700 font-body text-sm">
                    Meet our diverse team of talented announcers ready to make
                    your event unforgettable.
                  </p>
                </div>
              </div>
            </div>
          </div>
           {/* Bottom Microphone Image -- EDITED: Increased negative margin to reduce space */}
          <div className="relative -mt-24 md:-mt-52 flex justify-center z-0">
            <div
              className="w-full max-w-4xl"
              style={{
                filter: "grayscale(100%) contrast(1.2)",
              }}
            >
              <Image
                src="/group-microphone.png" // Replace with the actual path to your microphone group image
                alt="A group of microphones with a halftone effect"
                width={1000}
                height={600}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
