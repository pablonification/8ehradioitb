'use client'

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import type { ReactNode } from 'react'

type AuthProviderProps = {
  children: ReactNode
  session: Session | null
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}
