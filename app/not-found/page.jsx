'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] flex flex-col font-body">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-3">
        <div className="mx-auto max-w-5xl">
          <Image src="/8eh-real-long.png" alt="8EH Radio ITB" width={140} height={36} className="h-8 w-auto object-contain" priority />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-lg w-full">
          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="h-1.5 bg-[#f97316]" />
            <div className="p-8 space-y-4">
              <h1 className="font-heading text-7xl font-bold text-slate-900">404</h1>
              <h2 className="font-heading text-2xl font-bold text-slate-800">Halaman Tidak Ditemukan</h2>
              <p className="font-body text-slate-600">Halaman yang kamu cari tidak ada atau tautan sudah dihapus.</p>
              
              <div className="pt-4 space-y-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#f97316] text-white font-medium rounded-lg hover:bg-[#ea6c0a] transition-colors font-body"
                >
                  <FiHome className="w-5 h-5 mr-2" />
                  Ke Beranda
                </Link>
                
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors font-body"
                >
                  <FiArrowLeft className="w-5 h-5 mr-2" />
                  Kembali
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-xs text-slate-500 font-body text-center py-4">
        © {new Date().getFullYear()} Technic 8EH Radio ITB. All rights reserved.
      </footer>
    </div>
  );
}