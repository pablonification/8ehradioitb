'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import BlogForm from '@/app/components/BlogForm'
import { useSession } from 'next-auth/react'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  return res.json()
}

export default function EditPostPage() {
  const { slug } = useParams()
  const { data: session, status } = useSession()
  const resolvedSlug = Array.isArray(slug) ? slug[0] : slug
  const { data: post, error } = useSWR(resolvedSlug ? `/api/blog/${resolvedSlug}` : null, fetcher)

  if (status === 'loading' || !post)
    return <div className="font-body p-8 text-center">Loading...</div>

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

  if (error) return <div className="font-body">Failed to load post</div>

  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-bold text-gray-800">Edit Post</h1>
      <BlogForm post={post} isEditing={true} />
    </div>
  )
}
