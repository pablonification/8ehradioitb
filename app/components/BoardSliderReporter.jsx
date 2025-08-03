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
  "Happy Sri Sholihatul Hidayah": "/foto-agency/happy.png",
  "Evangeline Agnesia": "/foto-agency/evangeline.png",
  "Galuh Maharani Putriku": "/foto-agency/galuh.png",
  "Hillary Gwen Hartono": "/foto-agency/hillary.png",
  "Melodya Divana Fauziah": "/foto-agency/ody.png",
  "Jesica Patricia": "",
  "Tazkia Zahra Aulia": "/foto-agency/kia.png",
  "De’ Faiera Cyindria Hannum": "",
  "Arqila Surya Putra": "/foto-agency/arqila.png",
};

// Get announcer members from the JSON data
const members = announcerData.Announcers.map((announcer) => ({
  name: announcer.name,
  role: "Reporter & Video Editor",
  ig: announcer.ig,
  linkedin: announcer.linkedin,
  photoUrl: photoPaths[announcer.name] || "/placeholder.jpg",
  portfolio: announcer.portfolio,
}));

export default function BoardSliderReporter() {
  // --- MODIFICATION START ---
  // Filter members based on photo availability
  const completeMembers = members.filter(
    (member) => member.photoUrl !== "/placeholder.jpg",
  );
  const incompleteMembers = members.filter(
    (member) => member.photoUrl === "/placeholder.jpg",
  );
  // --- MODIFICATION END ---

  return (
    <>
      <Head>
        <link rel="preload" as="image" href="/LinkedIn.svg" />
        <link rel="preload" as="image" href="/Instagram.svg" />
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
        {/* Map over complete members for the Swiper */}
        {completeMembers.map((member, idx) => (
          <SwiperSlide key={idx} className="pb-8">
            <div className="flex flex-col items-center text-center space-y-4 bg-white backdrop-blur-sm pb-4 rounded-3xl h-full drop-shadow-md border border-gray-300 mx-4 md:mx-0 overflow-hidden">
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

              <div className="flex mb-3 align-center justify-center">
                <a
                  href={member.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex"
                  aria-label="Portfolio"
                >
                  <ButtonPrimary className="!bg-[#EFEAE6]/80 !text-[#444] hover:!bg-[#E5DED8] !p-2 mr-2 text-sm">
                    <Image
                      src="/folder.png"
                      alt="folder icon"
                      width={100}
                      height={100}
                      className="w-6 h-6 drop-shadow-lg"
                    />
                  </ButtonPrimary>
                </a>
                <a
                  href={member.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex"
                  aria-label="Portfolio"
                >
                  <ButtonPrimary className="!bg-[#EFEAE6]/80 !text-[#444] hover:!bg-[#E5DED8] !px-4 !py-2 text-sm">
                    View Portfolio
                  </ButtonPrimary>
                </a>
              </div>

              <div className="flex-grow flex flex-col justify-center mt-2 mb-8">
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
                    className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors opacity-30"
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
                    className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors opacity-30"
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
        <div className="mt-12 mx-auto max-w-7xl">
          <div className="p-6 bg-white drop-shadow-md border border-gray-300 rounded-3xl">
            {/* Container menggunakan layout Grid Responsif */}
            <div className="flex justify-start items-center flex-wrap space-y-4 md:space-y-0">
              {incompleteMembers.map((member, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-4 px-8 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors w-full lg:w-1/2"
                >
                  {/* Grup teks dengan nama & peran tersusun vertikal */}
                  <div>
                    <p className="font-heading font-semibold text-lg text-gray-800">
                      {member.name}
                    </p>
                    <p className="font-body text-sm text-gray-500">
                      {member.role}
                    </p>
                  </div>

                  {/* Grup ikon sosial media */}
                  <div className="flex space-x-3 flex-shrink-0 ml-4 items-center">
                    <div className="flex align-center justify-center">
                      <a
                        href={member.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex md:hidden"
                        aria-label="Portfolio"
                      >
                        <ButtonPrimary className="!bg-[#EFEAE6]/80 !text-[#444] hover:!bg-[#E5DED8] !p-2 mr-2 text-sm">
                          <Image
                            src="/folder.png"
                            alt="folder icon"
                            width={100}
                            height={100}
                            className="w-6 h-6 drop-shadow-lg"
                          />
                        </ButtonPrimary>
                      </a>
                      <a
                        href={member.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:inline-block hidden"
                        aria-label="Portfolio"
                      >
                        <ButtonPrimary className="!bg-[#EFEAE6]/80 !text-[#444] hover:!bg-[#E5DED8] !px-4 !py-2 text-sm">
                          View Portfolio
                        </ButtonPrimary>
                      </a>
                    </div>
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
