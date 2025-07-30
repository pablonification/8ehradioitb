"use client";

import Image from "next/image";
import Head from "next/head";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Grid } from "swiper/modules";
import announcerData from "@/public/list_name_linkedin_ig_rep.json";
import ButtonPrimary from "./ButtonPrimary"; // Reusing the Button component
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/grid";

const photoPaths = {
  "Happy Sri Sholihatul Hidayah": "/foto-rep/happy.jpg",
  "Evangeline Agnesia": "/foto-rep/evangeline.png",
  "Galuh Maharani Putriku": "/foto-rep/galuh.png",
  "Hillary Gwen Hartono": "/foto-rep/hillary.jpg",
  "Melodya Divana Fauziah": "/foto-rep/ody.jpg",
  "Jesica Patricia": "",
  "Tazkia Zahra Aulia": "/foto-rep/kia.png",
  "De’ Faiera Cyindria Hannum": "",
  "Arqila Surya Putra": "/foto-rep/arqila.jpg",
};

// Get announcer members from the JSON data, now including voiceUrl
const members = announcerData.Announcers.map((announcer) => ({
  name: announcer.name,
  role: "Reporter & Video Editor",
  ig: announcer.ig,
  linkedin: announcer.linkedin,
  photoUrl: photoPaths[announcer.name] || "/placeholder.jpg",
  portfolio: announcer.portfolio, // ntar diisi masing"
}));

export default function BoardSliderReporter() {
  return (
    <>
      <Head>
        <link rel="preload" as="image" href="/LinkedIn.svg" />
        <link rel="preload" as="image" href="/Instagram.svg" />
        <link rel="preload" as="image" href="/x-logo.svg" />
      </Head>
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
      >
        <style jsx global>{`
          .board-swiper .swiper-button-prev,
          .board-swiper .swiper-button-next {
            color: #6b7280;
          }
        `}</style>
        {members.map((member, idx) => (
          <SwiperSlide key={idx} className="pb-8">
            <div className="flex flex-col items-center text-center space-y-4 bg-white/30 backdrop-blur-sm p-4 rounded-3xl h-full drop-shadow-md border border-gray-300 mx-4 md:mx-0">
              <div className="w-36 h-36 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden">
                <Image
                  src={member.photoUrl}
                  alt={`Photo of ${member.name}`}
                  width={144}
                  height={144}
                  className="object-cover w-full h-full"
                  priority={idx < 8}
                  loading={idx < 8 ? "eager" : "lazy"}
                />
              </div>

              <div className="flex mb-3 align-center justify-center">
                <a
                  href={member.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                  aria-label="Portfolio"
                >
                  <Image
                    src="/folder.png"
                    alt="folder icon"
                    width={100}
                    height={100}
                    className="w-8 h-8 mr-2 drop-shadow-md"
                  />
                </a>
                <a
                  href={member.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                  aria-label="Portfolio"
                >
                  <ButtonPrimary className="!bg-[#EFEAE6]/80 !text-[#444] hover:!bg-[#E5DED8] !px-4 !py-2 text-sm">
                    View Portfolio
                  </ButtonPrimary>
                </a>
              </div>

              <div className="flex-grow flex flex-col justify-center">
                <h3 className="font-heading font-semibold text-lg text-gray-900">
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
                    className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
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
                    className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
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
    </>
  );
}
