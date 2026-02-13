'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import Head from 'next/head'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Grid } from 'swiper/modules'
import announcerData from '@/public/list_name_linkedin_ig_market.json'
import ButtonPrimary from './ButtonPrimary' // Reusing the Button component
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/grid'

const photoPaths: Record<string, string> = {
  'Caroline Adetya Tuati': '/foto-agency/olin.png',
  'Kayla Olivia Putri': '/foto-agency/ope.png',
  'Danella Nafisya': '/foto-agency/lala.png',
  'Aini Fakhirahani': '/foto-agency/aini.png',
  'Vanessa Kurniawan': '',
  'Iasha Putri Izzaty': '',
  'Rifqy Ahmad Lazuardi': '/foto-agency/juju.png',
  'Hamima Husna Nur Shabrina': '',
  'Marcella Stely Lukas': '/foto-agency/cella.png',
  'Zahrah Nur Azizah': '/foto-agency/ara.png',
  'Abdullah Sulaiman Tidar Nasution': '/foto-agency/abdul.png',
  'Happy Sri Sholihatul Hidayah': '/foto-agency/happy.png',
}

// Get announcer members from the JSON data
type MarketingMember = {
  name: string
  ig?: string
  linkedin?: string
  portfolio?: string
}

const members = announcerData.Announcers.map((announcer: MarketingMember) => ({
  name: announcer.name,
  role: 'Graphic Designer',
  ig: announcer.ig,
  linkedin: announcer.linkedin,
  photoUrl: photoPaths[announcer.name] || '/placeholder.jpg',
  portfolio: announcer.portfolio, // ntar diisi masing"
}))

export default function BoardSliderMarketing() {
  const swiperStyle: CSSProperties & { '--swiper-navigation-size': string } = {
    '--swiper-navigation-size': '30px',
  }

  // Filter members based on photo availability
  const completeMembers = members.filter((member) => member.photoUrl !== '/placeholder.jpg')
  const incompleteMembers = members.filter((member) => member.photoUrl === '/placeholder.jpg')

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
        {/* Map over complete members for the Swiper */}
        {completeMembers.map((member, idx) => (
          <SwiperSlide key={idx} className="pb-8">
            <div className="mx-4 flex h-full min-h-[420px] flex-col items-center space-y-4 overflow-hidden rounded-3xl border border-gray-300 bg-white pb-4 text-center drop-shadow-md backdrop-blur-sm md:mx-0">
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

              <div className="align-center mb-3 flex justify-center">
                <a
                  href={member.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex"
                  aria-label="Portfolio"
                >
                  <ButtonPrimary className="mr-2 !bg-[#EFEAE6]/80 !p-2 text-sm !text-[#444] hover:!bg-[#E5DED8]">
                    <Image
                      src="/folder.png"
                      alt="folder icon"
                      width={100}
                      height={100}
                      className="h-6 w-6 drop-shadow-lg"
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
                  <ButtonPrimary className="!bg-[#EFEAE6]/80 !px-4 !py-2 text-sm !text-[#444] hover:!bg-[#E5DED8]">
                    View Portfolio
                  </ButtonPrimary>
                </a>
              </div>

              <div className="mt-2 mb-8 flex flex-grow flex-col justify-center px-4">
                <h3 className="font-heading text-lg font-semibold text-gray-900">{member.name}</h3>
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
        <div className="mx-auto mt-12 max-w-7xl">
          <div className="rounded-3xl border border-gray-300 bg-white p-6 drop-shadow-md">
            <div className="flex flex-wrap items-center justify-start space-y-4 md:space-y-0">
              {incompleteMembers.map((member, idx) => (
                <div
                  key={idx}
                  className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-8 py-4 transition-colors hover:bg-gray-100 lg:w-1/2"
                >
                  <div>
                    <p className="font-heading text-lg font-semibold text-gray-800">
                      {member.name}
                    </p>
                    <p className="font-body text-sm text-gray-500">{member.role}</p>
                  </div>

                  <div className="ml-4 flex flex-shrink-0 items-center space-x-3">
                    <div className="align-center flex justify-center">
                      <a
                        href={member.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex md:hidden"
                        aria-label="Portfolio"
                      >
                        <ButtonPrimary className="mr-2 !bg-[#EFEAE6]/80 !p-2 text-sm !text-[#444] hover:!bg-[#E5DED8]">
                          <Image
                            src="/folder.png"
                            alt="folder icon"
                            width={100}
                            height={100}
                            className="h-6 w-6 drop-shadow-lg"
                          />
                        </ButtonPrimary>
                      </a>
                      <a
                        href={member.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden md:inline-block"
                        aria-label="Portfolio"
                      >
                        <ButtonPrimary className="!bg-[#EFEAE6]/80 !px-4 !py-2 text-sm !text-[#444] hover:!bg-[#E5DED8]">
                          View Portfolio
                        </ButtonPrimary>
                      </a>
                    </div>
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
