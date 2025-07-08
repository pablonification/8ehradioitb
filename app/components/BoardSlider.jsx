import Image from "next/image";
import Head from "next/head";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Grid } from "swiper/modules";
import boardData from "@/public/list_name_linkedin_ig.json";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/grid";

const photoPaths = {
  "Cindy Juanita KI'23":
    "/foto-mb/General Manager/General Manager_Cindy Juanita W.JPG",
  "Michelle Angelica BI'23":
    "/foto-mb/Human & Resource Development/HRD Director_Chellee.png",
  "Kevin Azra II'23":
    "/foto-mb/Human & Resource Development/Inovation and Creativity Manager_Kevin Azra.jpg",
  "Queenie Angelica BP'23":
    "/foto-mb/Human & Resource Development/Agency Manager_Queenie Angelica Juwanda.jpg",
  "Fardan Naufal SA'23":
    "/foto-mb/Human & Resource Development/People Management.JPG",
  "Nandita Mahyas AR'23":
    "/foto-mb/Human & Resource Development/Peope and Culture Manager_Nandita Mahyas A_.jpg",
  "Danella Nafisya MR'23":
    "/foto-mb/General Secretary/General Secretary_Danella Nafisya.png",
  "Qoulan Tsagila SI'23": "/foto-mb/General Secretary/HNA_Qoulan Tsaqila.jpg",
  "Fahlianti Afif PL'23":
    "/foto-mb/General Secretary/Vice HNA_Fahlianti Afif.png",
  "Kayla Adina MB'26": "/foto-mb/General Secretary/Finance Manager.JPG",
  "Aliyah Zidna GD'23":
    "/foto-mb/General Secretary/Vice Finance_Aliyah Zidna Latifanisa.jpg",
  "Keisha Amalia MB'23":
    "/foto-mb/Research & Development/Research & Development Director.jpg",
  "Rachael Immanuel MB'23":
    "/foto-mb/Research & Development/Vice Research & Development Director.jpg",
  "Aisya Cendekia MR'23":
    "/foto-mb/Public Relation/PR Director_Aisya Cendekia Putri.jpeg",
  "Adisha Oktaviani BP'23":
    "/foto-mb/Public Relation/Intracampus Manager_Adisha Oktaviani Ramadhan.jpg",
  "Virassiska Yuliana PG'23":
    "/foto-mb/Public Relation/Extracampus Manager_Virasiska Yuliana.jpg",
  "Marsa Faustina KL'23":
    "/foto-mb/Public Relation/Vice Extrcampus Manager_Marsa Faustina.jpg",
  "Marcella Stely DKV'23":
    "/foto-mb/Public Relation/Manager Partnership_Marcella Stely Lukas.jpeg",
  "Grace Natalie BI'23":
    "/foto-mb/Public Relation/Vice Manager Media Partner_Grace Natalie Simanjuntak.jpg",
  "Vanessa Kurniawan FA'23":
    "/foto-mb/Brand Awareness/Brand Awareness Director_Vanessa Kurniawan.JPG",
  "Arqila Surya II'23":
    "/foto-mb/Brand Awareness/Technology and Media Manager_Arqila Surya Putra.JPG",
  "Maria Anabel MB'26":
    "/foto-mb/Brand Awareness/Creative Marketing Manager_Maria Anabel.jpg",
  "M.A. Ghifari KI'23": "/foto-mb/Brand Awareness/Content Manager.jpg",
  "Zhahra Wintri KI'23": "/foto-mb/Brand Awareness/News Manager.jpg",
  "Rodo Samuel BA'23": "/foto-mb/Brand Awareness/Vice News Manager.jpg",
  "Raissa Azra BA'23":
    "/foto-mb/Brand Awareness/Vice Content Strategy_Raissa Azra Luthfiyah_.jpg",
  "Muhammad Raga TF'23":
    "/foto-mb/Brand Awareness/Vice Technology and Media Manager_Muhammad Raga Wibawa S.jpg",
  "Rifqy Ahmad BP'23": "/foto-mb/Brand Awareness/vice marketing.jpg",
  "Shobhia Shiam KI'23":
    "/foto-mb/On-Air Operations/On-Air Operations Director.jpg",
  "Happy Sri DKV'23":
    "/foto-mb/On-Air Operations/Vice On-Air Operations Director_Happy Sri Sholihatul Hidayah.jpg",
  "De' Faiera Cyindria TL'23":
    "/foto-mb/On-Air Operations/Producer Manager_De_ Faiera Cyindria Hannum.jpg",
  "Tamima Meirizaqeena KI'23":
    "/foto-mb/On-Air Operations/Announcer Manager_Tamima Meirizqeena.JPG",
  "Valerie Chelsea FA'23":
    "/foto-mb/On-Air Operations/Music Manager_Valerie Chelsea Wijaya.jpg",
  "Arisanti Nabilah FK'23":
    "/foto-mb/On-Air Operations/Reporter Manager_Arisanti Nabilah Kusumastuti_.jpg",
};

function getMembers(data) {
  const members = [];
  function traverse(node, role) {
    if (node.name) {
      members.push({
        name: node.name,
        role: role,
        ig: node.ig,
        linkedin: node.linkedin,
        photoUrl: photoPaths[node.name] || "/8eh-real.svg",
      });
    }

    if (node.subordinates) {
      for (const subRole in node.subordinates) {
        traverse(node.subordinates[subRole], subRole);
      }
    }

    for (const key in node) {
      if (
        key.startsWith("Vice ") &&
        typeof node[key] === "object" &&
        node[key] !== null
      ) {
        traverse(node[key], key);
      }
    }
  }

  const rootRole = Object.keys(data)[0];
  traverse(data[rootRole], rootRole);
  return members;
}

const members = getMembers(boardData);

export default function BoardSlider() {
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
        <style jsx global>{`
          .board-swiper .swiper-button-prev,
          .board-swiper .swiper-button-next {
            color: #6b7280;
          }
        `}</style>
        {members.map((member, idx) => (
          <SwiperSlide key={idx} className="pb-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-36 h-36 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
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
              <div>
                <h3 className="font-heading font-semibold text-lg text-gray-900">
                  {member.name}
                </h3>
                <p className="font-body text-sm text-gray-500">{member.role}</p>
              </div>
              <div className="flex space-x-4">
                {member.linkedin && (
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
                )}
                {member.ig && (
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
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}
