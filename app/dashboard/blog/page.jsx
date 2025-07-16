'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BlogDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && !['DEVELOPER', 'REPORTER'].includes(session.user.role)) {
      router.replace('/dashboard');
    }
  }, [session, status, router]);


  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (status === 'authenticated' && ['DEVELOPER', 'REPORTER'].includes(session.user.role)) {
    return (
      <div>
        <h1 className="text-2xl font-heading font-bold mb-4 text-gray-800">Blog Management</h1>
        <p className="font-body text-gray-700">Feature coming soon...</p>
      </div>
    );
  }

  return null; // or a loading/access denied component
} 