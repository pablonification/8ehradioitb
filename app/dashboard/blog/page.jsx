'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from 'swr';
import Link from 'next/link';
import { FiPlus, FiStar, FiEdit, FiTrash2 } from 'react-icons/fi';

const fetcher = (...args) => fetch(...args).then(res => res.json());

function BlogManagement() {
  const { data: posts, error, mutate } = useSWR('/api/blog', fetcher);
  const router = useRouter();

  const handleFeature = async (slug) => {
    try {
      await fetch(`/api/blog/feature/${slug}`, { method: 'PUT' });
      mutate();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (slug) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await fetch(`/api/blog/${slug}`, { method: 'DELETE' });
        mutate();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (error) return <div className="text-red-500 font-body">Failed to load posts.</div>;
  if (!posts) return <div className="font-body">Loading posts...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-heading font-bold text-gray-800">Blog Management</h1>
        <Link href="/dashboard/blog/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 cursor-pointer">
          <FiPlus />
          Create New Post
        </Link>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-body">Title</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-body">Category</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-body">Date</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 border-b border-gray-200 bg-transparent text-sm">
                  <p className="text-gray-900 whitespace-no-wrap font-body font-semibold">{post.title}</p>
                   {post.isFeatured && <span className="text-xs text-yellow-600 font-bold flex items-center gap-1 mt-1"><FiStar /> Featured</span>}
                </td>
                <td className="px-5 py-4 border-b border-gray-200 bg-transparent text-sm">
                  <span className="px-2 py-1 font-semibold leading-tight text-green-700 bg-green-100 rounded-full font-body">{post.category}</span>
                </td>
                <td className="px-5 py-4 border-b border-gray-200 bg-transparent text-sm">
                  <p className="text-gray-900 whitespace-no-wrap font-body">{new Date(post.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="px-5 py-4 border-b border-gray-200 bg-transparent text-sm text-right whitespace-nowrap">
                  <button
                    onClick={() => handleFeature(post.slug)}
                    disabled={post.isFeatured}
                    className={`p-2 rounded-md font-body transition-colors ${
                      post.isFeatured
                        ? "text-yellow-500 bg-yellow-50 cursor-not-allowed"
                        : "text-gray-600 hover:bg-yellow-100 hover:text-yellow-700"
                    } disabled:text-yellow-300 disabled:bg-transparent`}
                    title="Feature Post"
                  >
                    {post.isFeatured ? "Featured" : "Feature"}
                  </button>
                  <Link
                    href={`/dashboard/blog/edit/${post.slug}`}
                    className="p-2 rounded-md font-body text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors inline-block"
                    title="Edit Post"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post.slug)}
                    className="p-2 rounded-md font-body text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                    title="Delete Post"
                  >
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

  if (status === 'loading') {
    return <div className="p-8 text-center font-body">Loading...</div>;
  }
  
  const authorizedRoles = ["DEVELOPER", "REPORTER"];

  const isAuthorized = session && authorizedRoles.some(keyword => 
    session.user?.role?.includes(keyword)
  );

  if (!session || !isAuthorized) {
    return <div className="p-8 text-center text-red-500 font-body">Access Denied. You do not have permission to view this page.</div>;
  }

  return <BlogManagement />;
}