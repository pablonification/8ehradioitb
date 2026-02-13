'use client'

import Link from 'next/link'
import { FiHome, FiArrowLeft } from 'react-icons/fi'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="font-heading mb-4 text-6xl font-bold text-gray-900">404</h1>
            <h2 className="font-heading mb-2 text-2xl font-bold text-gray-900">Page Not Found</h2>
            <p className="font-body text-gray-600">
              The page you're looking for doesn't exist or the short link has been removed.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/"
              className="font-body inline-flex w-full items-center justify-center rounded-md bg-pink-600 px-6 py-3 font-medium text-white transition-colors hover:bg-pink-700"
            >
              <FiHome className="mr-2 h-5 w-5" />
              Go Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="font-body inline-flex w-full items-center justify-center rounded-md bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              <FiArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
