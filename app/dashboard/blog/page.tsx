'use client'

import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import Link from 'next/link'
import { FiPlus, FiStar } from 'react-icons/fi'

type BlogPostRow = {
  id: string
  slug: string
  title: string
  category: string | null
  createdAt: string
  isFeatured: boolean
}

const fetcher = async (url: string): Promise<BlogPostRow[]> => {
  const res = await fetch(url)
  return res.json()
}

function BlogManagement() {
  const { data: posts, error, mutate } = useSWR<BlogPostRow[]>('/api/blog', fetcher)

  const handleFeature = async (slug: string) => {
    try {
      await fetch(`/api/blog/feature/${slug}`, { method: 'PUT' })
      mutate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to feature post')
    }
  }

  const handleDelete = async (slug: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await fetch(`/api/blog/${slug}`, { method: 'DELETE' })
        mutate()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete post')
      }
    }
  }

  if (error) return <div className="font-body text-red-500">Failed to load posts.</div>
  if (!posts) return <div className="font-body">Loading posts...</div>

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="font-heading text-3xl font-bold text-gray-800">Blog Management</h1>
        <Link
          href="/dashboard/blog/new"
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition duration-300 hover:bg-blue-700"
        >
          <FiPlus />
          Create New Post
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-md">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="font-body border-b-2 border-gray-200 bg-gray-50 px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Title
              </th>
              <th className="font-body border-b-2 border-gray-200 bg-gray-50 px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Category
              </th>
              <th className="font-body border-b-2 border-gray-200 bg-gray-50 px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Date
              </th>
              <th className="border-b-2 border-gray-200 bg-gray-50 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="border-b border-gray-200 bg-transparent px-5 py-4 text-sm">
                  <p className="whitespace-no-wrap font-body font-semibold text-gray-900">
                    {post.title}
                  </p>
                  {post.isFeatured && (
                    <span className="mt-1 flex items-center gap-1 text-xs font-bold text-yellow-600">
                      <FiStar /> Featured
                    </span>
                  )}
                </td>
                <td className="border-b border-gray-200 bg-transparent px-5 py-4 text-sm">
                  <span className="font-body rounded-full bg-green-100 px-2 py-1 leading-tight font-semibold text-green-700">
                    {post.category}
                  </span>
                </td>
                <td className="border-b border-gray-200 bg-transparent px-5 py-4 text-sm">
                  <p className="whitespace-no-wrap font-body text-gray-900">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="border-b border-gray-200 bg-transparent px-5 py-4 text-right text-sm whitespace-nowrap">
                  <button
                    onClick={() => handleFeature(post.slug)}
                    disabled={post.isFeatured}
                    className={`font-body rounded-md p-2 transition-colors ${
                      post.isFeatured
                        ? 'cursor-not-allowed bg-yellow-50 text-yellow-500'
                        : 'text-gray-600 hover:bg-yellow-100 hover:text-yellow-700'
                    } disabled:bg-transparent disabled:text-yellow-300`}
                    title="Feature Post"
                  >
                    {post.isFeatured ? 'Featured' : 'Feature'}
                  </button>
                  <Link
                    href={`/dashboard/blog/edit/${post.slug}`}
                    className="font-body inline-block rounded-md p-2 text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-800"
                    title="Edit Post"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post.slug)}
                    className="font-body rounded-md p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
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
  )
}

export default function BlogDashboardPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="font-body p-8 text-center">Loading...</div>
  }

  const authorizedRoles = ['DEVELOPER', 'REPORTER']

  const isAuthorized =
    session && authorizedRoles.some((keyword) => session.user?.role?.includes(keyword))

  if (!session || !isAuthorized) {
    return (
      <div className="font-body p-8 text-center text-red-500">
        Access Denied. You do not have permission to view this page.
      </div>
    )
  }

  return <BlogManagement />
}
