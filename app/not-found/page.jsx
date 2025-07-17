'use client';

import Link from 'next/link';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-6xl font-heading font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
              Page Not Found
            </h2>
            <p className="text-gray-600 font-body">
              The page you're looking for doesn't exist or the short link has been removed.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-pink-600 text-white font-medium rounded-md hover:bg-pink-700 transition-colors font-body"
            >
              <FiHome className="w-5 h-5 mr-2" />
              Go Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors font-body"
            >
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 