'use client'

import Image from 'next/image'
import Head from 'next/head'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Grid } from 'swiper/modules'
import announcerData from '@/public/list_name_linkedin_ig_ann.json'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/grid'

const photoPaths: Record<string, string> = {
  'Shantika Ersa Alecya':
    '/foto-announcer/Screenshot_2025-05-22-09-05-32-69_99c04817c0de5652397fc8b56c3b3817 - Shantika Ersa Alecya.jpg',
  'Marsela Wanda Arista': '/foto-announcer/IMG_2338 - Marsela Wanda.jpg',
  'Maurana Idzil Fikryansyah': '/foto-announcer/IMG_4757 - Maurana Idzil Fikriansyah.jpeg',
  'Khalisa Nadya Lazuardi': '/foto-announcer/IMG_6965 - KL24-025-Zuzu.jpeg',
  'Nur Sofita': '/foto-announcer/IMG_1121 - Nur Sofita.jpeg',
  'Juliene Najla Aninditya': '/foto-announcer/foto juliene - Juliene Najla Aninditya.jpg',
  'Emir Muhammad Firassiyan': '/foto-announcer/6 - Emir Muhammad.png',
  'Rinjani Aulia Syifa': '/foto-announcer/IMG_3364 - Rinjani Aulia Syifa.jpeg',
  'Darren Valerian': '/foto-announcer/10524064_Darren Valerian_Foto diri - Darren Valerian.jpg',
  'Nadhifa Zavrina Musmarliansyah':
    '/foto-announcer/EBAD6C6A-7D18-4953-9901-4A84A5EAF1F1 - Nadhifa Z. M..jpeg',
  'Hamzah Abdul Rahim': '/foto-announcer/IMG_0365 - Hamzah Abdul Rahim.jpeg',
  'Dicky Ardiansyah': '/foto-announcer/IMG-20250212-WA0118 - Dicky Ardiansyah.jpg',
  'Zahra Aulia': '/foto-announcer/Picsart_25-05-21_20-30-27-988 - Zahra Aulia.jpg',
  'Nudia Salsabila': '/foto-announcer/FOTO NUD - Nudia Salsabila.jpg',
  'Theresya Rafaela Aritonang': '/foto-announcer/IMG_5330 - Theresya Rafaela A.jpeg',
  'Fauzia Marchinda Fezavera': '/foto-announcer/IMG_8080.PNG',
}

// Get announcer members from the JSON data
const members = announcerData.Announcers.map(
  (announcer: { name: string; ig?: string; linkedin?: string }) => ({
    name: announcer.name,
    role: 'Announcer',
    ig: announcer.ig,
    linkedin: announcer.linkedin,
    photoUrl: photoPaths[announcer.name] || '/8eh-real.svg',
  })
)

export default function BoardSliderAnnouncer() {
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
        grid={{ rows: 2, fill: 'row' }}
        navigation
        breakpoints={{
          0: { slidesPerView: 1, grid: { rows: 2 } },
          640: { slidesPerView: 2, grid: { rows: 2 } },
          1024: { slidesPerView: 4, grid: { rows: 2 } },
        }}
        className="board-swiper w-full rounded-2xl p-6"
      >
        <style jsx global>{`
          .board-swiper .swiper-button-prev,
          .board-swiper .swiper-button-next {
            color: #6b7280;
          }
        `}</style>
        {members.map((member, idx) => (
          <SwiperSlide key={idx} className="pb-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-lg bg-gray-200">
                <Image
                  src={member.photoUrl}
                  alt={`Photo of ${member.name}`}
                  width={144}
                  height={144}
                  className="h-full w-full object-cover"
                  priority={idx < 8}
                  loading={idx < 8 ? 'eager' : 'lazy'}
                />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="font-body text-sm text-gray-500">{member.role}</p>
              </div>
              <div className="flex space-x-4">
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-6 w-6 text-gray-500 transition-colors hover:text-gray-800"
                  >
                    <Image src="/LinkedIn.svg" alt="LinkedIn" width={24} height={24} />
                  </a>
                )}
                {member.ig && (
                  <a
                    href={`https://instagram.com/${member.ig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-6 w-6 text-gray-500 transition-colors hover:text-gray-800"
                  >
                    <Image src="/Instagram.svg" alt="Instagram" width={24} height={24} />
                  </a>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  )
}
