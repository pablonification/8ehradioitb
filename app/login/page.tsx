'use client'

import Image from 'next/image'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ButtonPrimary from '../components/ButtonPrimary'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9EBEB]">Loading...</div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7D6D6]">
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        {/* Left Panel */}
        <div className="relative hidden flex-col items-center justify-center p-12 md:flex">
          <Image src="/8eh.png" alt="8EH Radio Logo" width={300} height={300} objectFit="contain" />
          <h2 className="font-heading mt-4 text-4xl font-bold text-[#E36F6F] italic">
            #Meresonansi&Berkarya
          </h2>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm text-center">
            {/* Logo for mobile view */}
            <div className="mb-8 md:hidden">
              <Image
                src="/8eh.png"
                alt="8EH Radio Logo"
                width={150}
                height={150}
                className="mx-auto"
              />
            </div>

            <h1 className="font-heading text-5xl font-semibold text-gray-900">Ahoy, Kru’s!</h1>
            <p className="font-body mt-6 mb-4 text-sm text-gray-700">Login to your account</p>

            <ButtonPrimary
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="flex w-full items-center justify-center py-3 text-base"
            >
              <Image src="/google.svg" alt="Google Logo" width={20} height={20} className="mr-2" />
              <span>Log in with Google Account</span>
            </ButtonPrimary>
          </div>
        </div>
      </div>
      <footer className="font-body mb-4 py-4 text-center text-xs text-gray-500">
        © 2025 Technic 8EH Radio ITB. All rights reserved.
      </footer>
    </div>
  )
}
