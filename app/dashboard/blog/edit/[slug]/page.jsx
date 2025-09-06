'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import BlogForm from '@/app/components/BlogForm';
import { useSession } from 'next-auth/react';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function EditPostPage() {
  const { slug } = useParams();
  const { data: session, status } = useSession();
  const { data: post, error } = useSWR(slug ? `/api/blog/${slug}` : null, fetcher);

  if (status === "loading" || !post) return <div className="p-8 text-center font-body">Loading...</div>;

  const authorizedRoles = ["DEVELOPER", "REPORTER"];
  const isAuthorized = session && authorizedRoles.some(keyword => 
    session.user?.role?.includes(keyword)
  );

  if (!session || !isAuthorized) {
    return <div className="p-8 text-center text-red-500 font-body">Access Denied. You do not have permission to view this page.</div>;
  }

  if (error) return <div className="font-body">Failed to load post</div>;

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-6">Edit Post</h1>
      <BlogForm post={post} isEditing={true} />
    </div>
  );
}