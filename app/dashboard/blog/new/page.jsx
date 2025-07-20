'use client';

import BlogForm from '@/app/components/BlogForm';
import { useSession } from 'next-auth/react';

export default function NewPostPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="p-8 text-center font-body">Loading...</div>;
  }

  const authorizedRoles = ["DEVELOPER", "REPORTER"];
  if (!session || !authorizedRoles.includes(session.user?.role)) {
    return <div className="p-8 text-center text-red-500 font-body">Access Denied. You do not have permission to view this page.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-6">Create New Post</h1>
      <BlogForm />
    </div>
  );
}