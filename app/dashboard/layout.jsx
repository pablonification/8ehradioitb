'use client';

import DashboardSidebar from "@/app/components/DashboardSidebar";
import UserDropdown from "@/app/components/UserDropdown";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex bg-[#F7D6D6] min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex justify-end items-center p-4 border-b border-gray-200 bg-[#FBEAEA]">
            <UserDropdown />
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
        <footer className="text-xs text-gray-500 font-body text-center py-4 mb-4">
            © 2025 Technic 8EH Radio ITB. All rights reserved.
        </footer>
      </div>
    </div>
  );
} 