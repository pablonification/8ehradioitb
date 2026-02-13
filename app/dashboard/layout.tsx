'use client'

import { useState } from 'react'
import DashboardSidebar from '@/app/components/DashboardSidebar'
import UserDropdown from '@/app/components/UserDropdown'
import { FiMenu } from 'react-icons/fi'
import type { ReactNode, MouseEvent } from 'react'

type DashboardLayoutProps = {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="font-body flex min-h-screen bg-gray-100">
      {/* Sidebar untuk Desktop */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      {/* Sidebar untuk Mobile (Drawer) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="absolute top-0 left-0 h-full"
            onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <DashboardSidebar />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4 shadow-sm lg:justify-end">
          <button className="p-2 text-gray-700 lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <FiMenu size={24} />
          </button>
          <UserDropdown />
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
        <footer className="font-body py-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Technic 8EH Radio ITB. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
