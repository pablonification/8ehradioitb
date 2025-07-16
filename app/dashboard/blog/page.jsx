'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (...args) => fetch(...args).then(res => res.json());

function BlogManagement() {
  const { data: posts, error, mutate } = useSWR('/api/blog', fetcher);
  const router = useRouter();

  const handleFeature = async (slug) => {
    try {
      const res = await fetch(`/api/blog/feature/${slug}`, {
        method: 'PUT',
      });
      if (!res.ok) {
        throw new Error('Failed to feature post');
      }
      mutate(); // Re-fetch to show the new featured status
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (slug) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const res = await fetch(`/api/blog/${slug}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Failed to delete post');
        }
        mutate(); // Re-fetch the data to update the list
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (error) return <div className="text-red-500">Failed to load posts.</div>;
  if (!posts) return <div>Loading posts...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading font-bold text-gray-800">Blog Management</h1>
        <Link href="/dashboard/blog/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
          Create New Post
        </Link>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Category
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className={post.isFeatured ? 'bg-indigo-50' : ''}>
                <td className="px-5 py-4 border-b border-gray-200 bg-transparent text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{post.title}</p>
                </td>
                <td className="px-5 py-4 border-b border-gray-200 bg-transparent text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{post.category}</p>
                </td>
                <td className="px-5 py-4 border-b border-gray-200 bg-transparent text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-5 py-4 border-b border-gray-200 bg-transparent text-sm text-right">
                  <button 
                    onClick={() => handleFeature(post.slug)} 
                    disabled={post.isFeatured}
                    className="text-green-600 hover:text-green-900 mr-4 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {post.isFeatured ? 'Featured' : 'Feature'}
                  </button>
                  <Link href={`/dashboard/blog/edit/${post.slug}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(post.slug)} className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


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
    return <BlogManagement />;
  }

  return null;
} 