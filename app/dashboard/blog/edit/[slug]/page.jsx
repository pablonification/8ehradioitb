
'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import BlogForm from '@/app/components/BlogForm';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function EditPostPage() {
  const { slug } = useParams();
  const { data: post, error } = useSWR(slug ? `/api/blog/${slug}` : null, fetcher);

  if (error) return <div className="font-body">Failed to load post</div>;
  if (!post) return <div className="font-body">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-6">Edit Post</h1>
      <BlogForm post={post} isEditing={true} />
    </div>
  );
} 