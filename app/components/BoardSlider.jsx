import Image from "next/image";
import Head from "next/head";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Grid } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/grid";

// Dummy data
const defaultMembers = Array.from({ length: 16 }, () => ({
  name: "Alex Johnson",
  role: "Lead Announcer",
  bio: "With a great passion for radio, Alex is dedicated to engaging with the audience and sharing compelling stories.",
}));

export default function BoardSlider({ members = defaultMembers }) {
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
          0: { slidesPerView: 1, grid: { rows: 2 } },
          640: { slidesPerView: 2, grid: { rows: 2 } },
          1024: { slidesPerView: 4, grid: { rows: 2 } },
        }}
        className="board-swiper w-full p-6 rounded-2xl"
      >
        {/* Global styles for navigation color */}
        <style jsx global>{`
          .board-swiper .swiper-button-prev,
          .board-swiper .swiper-button-next {
            color: #6b7280;
          }
        `}</style>
        {members.map((member, idx) => (
          <SwiperSlide key={idx} className="pb-8">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar placeholder */}
              <div className="w-36 h-36 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 font-body">Photo</span>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-gray-900">
                  {member.name}
                </h3>
                <p className="font-body text-sm text-gray-500">{member.role}</p>
              </div>
              <p className="font-body text-sm text-gray-600 px-4">
                {member.bio}
              </p>
              {/* Social Icons */}
              <div className="flex space-x-4">
                {["/LinkedIn.svg", "/Instagram.svg"].map((icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-6 h-6 text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Image
                      src={icon}
                      alt="icon"
                      width={32}
                      height={32}
                      priority={i === 0}
                      loading="eager"
                    />
                  </a>
                ))}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}
