'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import Head from 'next/head'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Grid } from 'swiper/modules'
import announcerData from '@/public/list_name_linkedin_ig_ann_agency.json'
import Waveform from './Waveform' // Import the Waveform component
import { getAudioUrl } from '@/lib/audioUtils'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/grid'

const photoPaths: Record<string, string> = {
  'Virasiska Yuliana': '',
  'Nudia Salsabila': '/foto-agency/nudia.png',
  'Alifia Ayena': '/foto-agency/alifia.png',
  'Darren Valerian': '/foto-agency/darren.png',
  'Maurana Idzil Fikryansyah': '/foto-agency/fiki.png',
  'Benedictus Alfian Wibisono': '',
  'Alika Mirfatya': '/foto-agency/lily.png',
  'Marsela Wanda Arista': '/foto-agency/wanda.png',
  'Tamima Meirizqeena': '',
  'Rinjani Aulia Syifa': '/foto-agency/rinjani.png',
  Audrey: '',
  'Muhammad Raga Wibawa Sugiarto': '/foto-agency/raga.png',
  'Nur Sofita': '/foto-agency/sofi.png',
  'Fahlianti Afif': '/foto-agency/lia.png',
  'Barsa Naadhir Akmal': '/foto-agency/barsa.png',
  'Nayla Fijar Az-Zahra': '/foto-agency/nayel.png',
  'Queenie Angelica Juwanda': '/foto-agency/queenie.png',
  'Naura Tsabita Wibowo': '/foto-agency/naura.png',
  'Khalisa Nadya Lazuardi': '/foto-agency/zuzu.png',
  'Dicky Ardiansyah': '/foto-agency/dicky.png',
  'Emir Muhammad Firassiyan': '/foto-agency/emir.png',
  'Hamzah Abdul Rahim': '/foto-agency/hamzah.png',
  'Abdullah Sulaiman Tidar Nasution': '/foto-agency/abdul.png',
  'Claudine Mayra Hartono': '/foto-agency/claudine.png',
  'Muhammad Jordan Ferimeison': '/foto-agency/jordan.png',
  'Juliene Najla Aninditya': '/foto-agency/juliene.png',
  'Ivan Sultan Firmansyah': '/foto-agency/ivan.png',
  'Nadhifa Zavrina Musmarliansyah': '/foto-agency/nadhifa.png',
  'Zahrah Nur Azizah': '/foto-agency/ara.png',
  'Evangeline Agnesia': '/foto-agency/evangeline.png',
  'Galuh Maharani Putriku': '/foto-agency/galuh.png',
}

const voicePaths: Record<string, string> = {
  'Virasiska Yuliana': '',
  'Nudia Salsabila': '/voice-ann/nudia.m4a',
  'Alifia Ayena': '/voice-ann/alifia.m4a',
  'Darren Valerian': '',
  'Maurana Idzil Fikryansyah': '/voice-ann/fiki.m4a',
  'Benedictus Alfian Wibisono': '',
  'Alika Mirfatya': '/voice-ann/lily.m4a',
  'Marsela Wanda Arista': '/voice-ann/wanda.m4a',
  'Tamima Meirizqeena': '',
  'Rinjani Aulia Syifa': '',
  Audrey: '',
  'Muhammad Raga Wibawa Sugiarto': '/voice-ann/raga.m4a',
  'Nur Sofita': '/voice-ann/sofi.m4a',
  'Fahlianti Afif': '/voice-ann/lia.m4a',
  'Barsa Naadhir Akmal': '/voice-ann/barsa.m4a',
  'Nayla Fijar Az-Zahra': '/voice-ann/nayel.m4a',
  'Queenie Angelica Juwanda': '/voice-ann/queenie.mp3',
  'Naura Tsabita Wibowo': '/voice-ann/naura.m4a',
  'Khalisa Nadya Lazuardi': '/voice-ann/zuzu.wav',
  'Dicky Ardiansyah': '/voice-ann/dicky.m4a',
  'Emir Muhammad Firassiyan': '/voice-ann/emir.mp3',
  'Hamzah Abdul Rahim': '/voice-ann/hamzah.m4a',
  'Abdullah Sulaiman Tidar Nasution': '/voice-ann/abdul.m4a',
  'Claudine Mayra Hartono': '/voice-ann/claudine.m4a',
  'Muhammad Jordan Ferimeison': '/voice-ann/jordan.m4a',
  'Juliene Najla Aninditya': '/voice-ann/juli.m4a',
  'Ivan Sultan Firmansyah': '/voice-ann/ivan.wav',
  'Nadhifa Zavrina Musmarliansyah': '/voice-ann/nadhifa.m4a',
  'Zahrah Nur Azizah': '/voice-ann/ara.m4a',
  'Evangeline Agnesia': '/voice-ann/evangeline.m4a',
  'Galuh Maharani Putriku': '',
}

// Get announcer members from the JSON data
type AgencyAnnouncer = {
  name: string
  ig?: string
  linkedin?: string
}

const allMembers = announcerData.Announcers.map((announcer: AgencyAnnouncer) => ({
  name: announcer.name,
  role: 'Announcer',
  ig: announcer.ig,
  linkedin: announcer.linkedin,
  photoUrl: photoPaths[announcer.name] || '/placeholder.jpg',
  voiceUrl: getAudioUrl(voicePaths[announcer.name]) || '',
}))

export default function BoardSliderAnnouncerAgency() {
  const swiperStyle: CSSProperties & { '--swiper-navigation-size': string } = {
    '--swiper-navigation-size': '30px',
  }

  // --- MODIFICATION START ---
  // Filter members into two groups: those with complete data and those without.
  const completeMembers = allMembers.filter(
    (member) => member.photoUrl !== '/placeholder.jpg' && member.voiceUrl !== ''
  )

  const incompleteMembers = allMembers.filter(
    (member) => member.photoUrl === '/placeholder.jpg' || member.voiceUrl === ''
  )
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
        grid={{ rows: 2, fill: 'row' }}
        navigation
        breakpoints={{
          0: { slidesPerView: 1, grid: { rows: 1 } },
          640: { slidesPerView: 2, grid: { rows: 1 } },
          1024: { slidesPerView: 4, grid: { rows: 2 } },
        }}
        className="board-swiper w-full rounded-2xl p-6"
        style={swiperStyle}
      >
        <style jsx global>{`
          .board-swiper .swiper-button-prev,
          .board-swiper .swiper-button-next {
            color: #6b7280;
          }
        `}</style>
        {completeMembers.map((member, idx) => (
          <SwiperSlide key={idx} className="pb-4">
            <div className="mx-4 flex min-h-[440px] flex-col items-center space-y-4 overflow-hidden rounded-3xl border border-gray-300 bg-white pb-4 text-center drop-shadow-md backdrop-blur-sm md:mx-0">
              <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-t-xl bg-gray-200">
                <Image
                  src={member.photoUrl}
                  alt={`Photo of ${member.name}`}
                  width={500}
                  height={500}
                  className="h-full w-full object-cover"
                  priority={idx < 8}
                  loading={idx < 8 ? 'eager' : 'lazy'}
                />
              </div>

              {/* Waveform component for voice sample */}
              <div className="border-b-1 border-gray-300 pb-4">
                {member.voiceUrl && (
                  <Waveform audioUrl={member.voiceUrl} announcerName={member.name.split(' ')[0]} />
                )}
              </div>

              <div className="flex flex-grow flex-col justify-center">
                <h3 className="font-heading mt-0 text-xl font-semibold text-gray-900">
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
                    className="h-6 w-6 text-gray-500 transition-colors hover:text-gray-800"
                  >
                    <Image src="/LinkedIn.svg" alt="LinkedIn" width={24} height={24} />
                  </a>
                )) || (
                  <a
                    rel="noopener noreferrer"
                    className="h-6 w-6 text-gray-500 opacity-30 transition-colors hover:text-gray-800"
                  >
                    <Image src="/LinkedIn.svg" alt="LinkedIn" width={24} height={24} />
                  </a>
                )}
                {(member.ig && (
                  <a
                    href={`https://instagram.com/${member.ig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-6 w-6 text-gray-500 transition-colors hover:text-gray-800"
                  >
                    <Image src="/Instagram.svg" alt="Instagram" width={24} height={24} />
                  </a>
                )) || (
                  <a
                    rel="noopener noreferrer"
                    className="h-6 w-6 text-gray-500 opacity-30 transition-colors hover:text-gray-800"
                  >
                    <Image src="/Instagram.svg" alt="Instagram" width={24} height={24} />
                  </a>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* --- NEW SECTION FOR INCOMPLETE PROFILES --- */}
      {incompleteMembers.length > 0 && (
        <div className="mx-auto mt-12 max-w-7xl px-0">
          <div className="rounded-3xl border border-gray-300 bg-white p-6 drop-shadow-md">
            {/* <h3 className="font-heading text-2xl font-semibold text-center mb-6 text-gray-800">
              Also on Our Team
            </h3> */}
            {/* Change to grid layout */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incompleteMembers.map((member, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                >
                  {/* Grouping name and role together */}
                  <div>
                    <p className="font-heading text-lg font-semibold text-gray-800">
                      {member.name}
                    </p>
                    <p className="font-body text-sm text-gray-500">{member.role}</p>
                  </div>

                  <div className="ml-4 flex flex-shrink-0 space-x-3">
                    {(member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-6 w-6 text-gray-500 transition-colors hover:text-gray-800"
                      >
                        <Image src="/LinkedIn.svg" alt="LinkedIn" width={24} height={24} />
                      </a>
                    )) || (
                      <div className="h-6 w-6 opacity-30">
                        <Image src="/LinkedIn.svg" alt="LinkedIn" width={24} height={24} />
                      </div>
                    )}
                    {(member.ig && (
                      <a
                        href={`https://instagram.com/${member.ig}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-6 w-6 text-gray-500 transition-colors hover:text-gray-800"
                      >
                        <Image src="/Instagram.svg" alt="Instagram" width={24} height={24} />
                      </a>
                    )) || (
                      <div className="h-6 w-6 opacity-30">
                        <Image src="/Instagram.svg" alt="Instagram" width={24} height={24} />
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
  )
}
