'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'next/navigation'
import ButtonPrimary from '@/app/components/ButtonPrimary'
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

export default function PasswordProtectedPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Please enter a password')
      return
    }
    setLoading(true)
    setError('')
    // Redirect ke API dengan password sebagai query param
    window.location.href = `/api/redirect/${slug}?password=${encodeURIComponent(password)}`
  }

  return (
    <div className="font-body flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
              <FiLock className="h-8 w-8 text-pink-600" />
            </div>
            <h1 className="font-heading mb-2 text-2xl font-bold text-gray-900">
              Password Protected
            </h1>
            <p className="text-gray-600">
              This link is password protected. Please enter the password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-gray-900">
            <div>
              <label className="font-body mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-body w-full rounded-md border border-transparent bg-gray-100 px-4 py-3 pr-12 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  placeholder="Enter password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <ButtonPrimary type="submit" disabled={loading} className="font-body w-full">
              {loading ? 'Verifying...' : 'Continue'}
            </ButtonPrimary>
          </form>
        </div>
      </div>
    </div>
  )
}
