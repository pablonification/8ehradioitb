'use client';

import { useSession } from "next-auth/react";

export default function DashboardHome() {
  const { data: session } = useSession();
  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-4 text-gray-800">Dashboard</h1>
      {session && (
        <p className="font-body text-gray-700">Welcome back, {session.user.name}!</p>
      )}
      <p className="mt-6 text-sm text-gray-500 font-body">
        Select a section from the sidebar to get started.
      </p>
    </div>
  );
} 