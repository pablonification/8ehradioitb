"use client";

import Image from "next/image";
import Head from "next/head";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Grid } from "swiper/modules";
import announcerData from "@/public/list_name_linkedin_ig_ann_agency.json";
import Waveform from "./Waveform"; // Import the Waveform component
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/grid";

const photoPaths = {
  "Virasiska Yuliana": "",
  "Nudia Salsabila": "/foto-announcer/FOTO NUD - Nudia Salsabila.jpg",
  "Alifia Ayena": "/foto-announcer/alifia.png",
  "Darren Valerian":
    "/foto-announcer/10524064_Darren Valerian_Foto diri - Darren Valerian.jpg",
  "Maurana Idzil Fikryansyah":
    "/foto-announcer/IMG_4757 - Maurana Idzil Fikriansyah.jpeg",
  "Benedictus Alfian Wibisono": "",
  "Alika Mirfatya": "/foto-announcer/lily.JPG",
  "Marsela Wanda Arista": "/foto-announcer/IMG_2338 - Marsela Wanda.jpg",
  "Tamima Meirizqeena": "",
  "Rinjani Aulia Syifa": "/foto-announcer/IMG_3364 - Rinjani Aulia Syifa.jpeg",
  Audrey: "",
  "Muhammad Raga Wibawa Sugiarto": "/foto-announcer/raga.png",
  "Nur Sofita": "/foto-announcer/sofi.jpg",
  "Fahlianti Afif": "/foto-announcer/lia.png",
  "Barsa Naadhir Akmal": "/foto-announcer/barsa.jpg",
  "Nayla Fijar Az-Zahra": "/foto-announcer/nayel.png",
  "Queenie Angelica Juwanda": "/foto-announcer/queenie.png",
  "Naura Tsabita Wibowo": "/foto-announcer/naura.JPG",
  "Khalisa Nadya Lazuardi": "/foto-announcer/IMG_6965 - KL24-025-Zuzu.jpeg",
  "Dicky Ardiansyah":
    "/foto-announcer/IMG-20250212-WA0118 - Dicky Ardiansyah.jpg",
  "Emir Muhammad Firassiyan": "/foto-announcer/6 - Emir Muhammad.png",
  "Hamzah Abdul Rahim": "/foto-announcer/IMG_0365 - Hamzah Abdul Rahim.jpeg",
  "Abdullah Sulaiman Tidar Nasution": "/foto-announcer/abdul.png",
  "Claudine Mayra Hartono": "/foto-announcer/claudine.jpg",
  "Muhammad Jordan Ferimeison": "/foto-announcer/jordan.jpeg",
  "Juliene Najla Aninditya":
    "/foto-announcer/foto juliene - Juliene Najla Aninditya.jpg",
  "Ivan Sultan Firmansyah": "/foto-announcer/ivan.PNG",
  "Nadhifa Zavrina Musmarliansyah":
    "/foto-announcer/EBAD6C6A-7D18-4953-9901-4A84A5EAF1F1 - Nadhifa Z. M..jpeg",
  "Zahrah Nur Azizah": "/foto-announcer/ara.PNG",
  "Evangeline Agnesia": "/foto-announcer/evangeline.png",
  "Galuh Maharani Putriku": "/foto-announcer/galuh.png",
};

const voicePaths = {
  "Virasiska Yuliana": "",
  "Nudia Salsabila": "/voice-ann/nudia.m4a",
  "Alifia Ayena": "/voice-ann/alifia.m4a",
  "Darren Valerian": "",
  "Maurana Idzil Fikryansyah": "/voice-ann/fiki.m4a",
  "Benedictus Alfian Wibisono": "",
  "Alika Mirfatya": "/voice-ann/lily.m4a",
  "Marsela Wanda Arista": "/voice-ann/wanda.m4a",
  "Tamima Meirizqeena": "",
  "Rinjani Aulia Syifa": "",
  Audrey: "",
  "Muhammad Raga Wibawa Sugiarto": "/voice-ann/raga.m4a",
  "Nur Sofita": "/voice-ann/sofi.m4a",
  "Fahlianti Afif": "/voice-ann/lia.m4a",
  "Barsa Naadhir Akmal": "/voice-ann/barsa.m4a",
  "Nayla Fijar Az-Zahra": "/voice-ann/nayel.m4a",
  "Queenie Angelica Juwanda": "/voice-ann/queenie.mp3",
  "Naura Tsabita Wibowo": "/voice-ann/naura.m4a",
  "Khalisa Nadya Lazuardi": "/voice-ann/zuzu.wav",
  "Dicky Ardiansyah": "/voice-ann/dicky.m4a",
  "Emir Muhammad Firassiyan": "/voice-ann/emir.mp3",
  "Hamzah Abdul Rahim": "/voice-ann/hamzah.m4a",
  "Abdullah Sulaiman Tidar Nasution": "/voice-ann/abdul.m4a",
  "Claudine Mayra Hartono": "",
  "Muhammad Jordan Ferimeison": "/voice-ann/jordan.m4a",
  "Juliene Najla Aninditya": "/voice-ann/juli.m4a",
  "Ivan Sultan Firmansyah": "/voice-ann/ivan.wav",
  "Nadhifa Zavrina Musmarliansyah": "/voice-ann/nadhifa.m4a",
  "Zahrah Nur Azizah": "/voice-ann/ara.m4a",
  "Evangeline Agnesia": "/voice-ann/evangeline.m4a",
  "Galuh Maharani Putriku": "",
};

// Get announcer members from the JSON data
const allMembers = announcerData.Announcers.map((announcer) => ({
  name: announcer.name,
  role: "Announcer",
  ig: announcer.ig,
  linkedin: announcer.linkedin,
  photoUrl: photoPaths[announcer.name] || "/placeholder.jpg",
  voiceUrl: voicePaths[announcer.name] || "",
}));

export default function BoardSliderAnnouncerAgency() {
  // --- MODIFICATION START ---
  // Filter members into two groups: those with complete data and those without.
  const completeMembers = allMembers.filter(
    (member) =>
      member.photoUrl !== "/placeholder.jpg" && member.voiceUrl !== "",
  );

  const incompleteMembers = allMembers.filter(
    (member) =>
      member.photoUrl === "/placeholder.jpg" || member.voiceUrl === "",
  );
  // --- MODIFICATION END ---

  return (
    <>
      <Head>
        <link rel="preload" as="image" href="/LinkedIn.svg" />
        <link rel="preload" as="image" href="/Instagram.svg" />
        <link rel="preload" as="image" href="/x-logo.svg" />
      </Head>

      {/* Swiper for members with complete profiles */}
      <Swiper
        modules={[Navigation, Grid]}
        spaceBetween={20}
        slidesPerView={4}
        slidesPerGroup={1}
        grid={{ rows: 2, fill: "row" }}
        navigation
        breakpoints={{
          0: { slidesPerView: 1, grid: { rows: 1 } },
          640: { slidesPerView: 2, grid: { rows: 1 } },
          1024: { slidesPerView: 4, grid: { rows: 2 } },
        }}
        className="board-swiper w-full p-6 rounded-2xl"
        style={{
          "--swiper-navigation-size": "30px",
        }}
      >
        <style jsx global>{`
          .board-swiper .swiper-button-prev,
          .board-swiper .swiper-button-next {
            color: #6b7280;
          }
        `}</style>
        {completeMembers.map((member, idx) => (
          <SwiperSlide key={idx} className="pb-4">
            <div className="flex flex-col items-center text-center space-y-4 bg-white backdrop-blur-sm pb-4 rounded-3xl drop-shadow-md border border-gray-300 min-h-[440px] mx-4 md:mx-0 overflow-hidden">
              <div className="w-full h-48 rounded-t-xl bg-gray-200 flex items-center justify-center overflow-hidden">
                <Image
                  src={member.photoUrl}
                  alt={`Photo of ${member.name}`}
                  width={500}
                  height={500}
                  className="object-cover w-full h-full"
                  priority={idx < 8}
                  loading={idx < 8 ? "eager" : "lazy"}
                />
              </div>

              {/* Waveform component for voice sample */}
              <div className="border-b-1 border-gray-300 pb-4">
                {member.voiceUrl && (
                  <Waveform
                    audioUrl={member.voiceUrl}
                    announcerName={member.name.split(" ")[0]}
                  />
                )}
              </div>

              <div className="flex-grow flex flex-col justify-center">
                <h3 className="font-heading font-semibold text-xl text-gray-900 mt-0">
                  {member.name}
                </h3>
                <p className="font-body text-sm text-gray-500">{member.role}</p>
              </div>

              <div className="flex space-x-4">
                {(member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Image
                      src="/LinkedIn.svg"
                      alt="LinkedIn"
                      width={24}
                      height={24}
                    />
                  </a>
                )) || (
                  <a
                    rel="noopener noreferrer"
                    className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors  opacity-30"
                  >
                    <Image
                      src="/LinkedIn.svg"
                      alt="LinkedIn"
                      width={24}
                      height={24}
                    />
                  </a>
                )}
                {(member.ig && (
                  <a
                    href={`https://instagram.com/${member.ig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Image
                      src="/Instagram.svg"
                      alt="Instagram"
                      width={24}
                      height={24}
                    />
                  </a>
                )) || (
                  <a
                    rel="noopener noreferrer"
                    className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors  opacity-30"
                  >
                    <Image
                      src="/Instagram.svg"
                      alt="Instagram"
                      width={24}
                      height={24}
                    />
                  </a>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* --- NEW SECTION FOR INCOMPLETE PROFILES --- */}
      {incompleteMembers.length > 0 && (
        <div className="mt-12 mx-auto max-w-7xl px-0">
          <div className="p-6 bg-white drop-shadow-md border border-gray-300 rounded-3xl">
            {/* <h3 className="font-heading text-2xl font-semibold text-center mb-6 text-gray-800">
              Also on Our Team
            </h3> */}
            {/* Change to grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incompleteMembers.map((member, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {/* Grouping name and role together */}
                  <div>
                    <p className="font-heading font-semibold text-lg text-gray-800">
                      {member.name}
                    </p>
                    <p className="font-body text-sm text-gray-500">
                      {member.role}
                    </p>
                  </div>

                  <div className="flex space-x-3 flex-shrink-0 ml-4">
                    {(member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <Image
                          src="/LinkedIn.svg"
                          alt="LinkedIn"
                          width={24}
                          height={24}
                        />
                      </a>
                    )) || (
                      <div className="w-6 h-6 opacity-30">
                        <Image
                          src="/LinkedIn.svg"
                          alt="LinkedIn"
                          width={24}
                          height={24}
                        />
                      </div>
                    )}
                    {(member.ig && (
                      <a
                        href={`https://instagram.com/${member.ig}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <Image
                          src="/Instagram.svg"
                          alt="Instagram"
                          width={24}
                          height={24}
                        />
                      </a>
                    )) || (
                      <div className="w-6 h-6 opacity-30">
                        <Image
                          src="/Instagram.svg"
                          alt="Instagram"
                          width={24}
                          height={24}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
