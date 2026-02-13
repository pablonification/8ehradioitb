'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import ButtonPrimary from '@/app/components/ButtonPrimary'

const RadioPlayer = dynamic(() => import('@/app/components/RadioPlayer'), {
  ssr: false,
})

export default function HeroSection() {
  const router = useRouter()
  const [isSafari, setIsSafari] = useState(false)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent
      const detectedSafari =
        /Safari/i.test(ua) && !/Chrome|Chromium|OPR|Edg|CriOS|FxiOS|EdgiOS/i.test(ua)
      setIsSafari(detectedSafari)
    }
  }, [])

  return (
    <section
      className="relative overflow-hidden bg-[#FDFBF6] pt-28 pb-0"
      role="banner"
      aria-label="Welcome to 8EH Radio ITB"
    >
      {/* Decorative gradient blob */}
      <Image
        src="/mastercard.png"
        alt="Abstract background gradient for 8EH Radio ITB hero section"
        width={2000}
        height={434}
        className="pointer-events-none absolute -top-10 left-160 z-0 -translate-x-1/2 opacity-70 select-none"
        priority
      />

      {/* Content container */}
      <div className="relative z-10 mx-auto grid max-w-7xl items-start gap-x-8 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        {/* Text */}
        <div className="md:col-span-1">
          <h1 className="font-accent text-5xl leading-tight font-bold text-gray-900 sm:text-6xl md:text-7xl">
            Welcome to <br />
            8EH Radio ITB
          </h1>
        </div>
        {/* CTA */}
        <div className="mt-8 space-y-6 md:col-span-1 md:mt-2 md:text-left">
          <p className="font-body max-w-sm text-base text-gray-700">
            Dengarkan 8EH Radio untuk kabar terkini seputar kampus, musik hits, dan hiburan seru!
            Bergabunglah dengan komunitas kami dan temukan dunia dengan kreativitas dan keseruan
            tanpa batas!
          </p>
          <div className="flex items-center justify-start gap-4">
            <ButtonPrimary
              className="!bg-[#EA4A30] !px-8 !py-3 !text-white hover:!bg-[#D0402A]"
              onClick={() => router.push('/about-us')}
              aria-label="Learn more about 8EH Radio ITB"
            >
              Learn More
            </ButtonPrimary>
            <a
              href="https://www.instagram.com/regenerasi8eh/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
              aria-label="Follow us on Instagram"
            >
              <ButtonPrimary className="!bg-[#EFEAE6]/80 !px-8 !py-3 !text-[#444] hover:!bg-[#E5DED8]">
                Join
              </ButtonPrimary>
            </a>
          </div>
        </div>
      </div>

      {/* Radio Image with Fade */}
      <div className="relative -mt-36 flex justify-center md:-mt-60">
        <Image
          src="/radio-home.png"
          alt="8EH Radio ITB Studio Illustration"
          width={1200}
          height={700}
          className={`[mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] ${!isSafari ? 'mix-blend-multiply' : ''}`}
          priority
        />
      </div>

      {/* Sticky small player (desktop) */}
      <div className="hidden">
        <RadioPlayer compact />
      </div>
    </section>
  )
}
