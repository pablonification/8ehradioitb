'use client'

import { type ChangeEvent, useState } from 'react'
import useSWR from 'swr'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { useSession } from 'next-auth/react'
import { hasAnyRole } from '@/lib/roleUtils'

type ProgramVideoId = string | number

type ProgramVideo = {
  id: ProgramVideoId
  title: string
  link: string
  thumbnail: string
}

type ProgramVideoForm = {
  title: string
  link: string
  thumbnail: File | null
}

const fetcher = (url: string): Promise<ProgramVideo[]> => fetch(url).then((r) => r.json())

export default function ProgramVideosPage() {
  const { data: session, status } = useSession()
  const { data: videos, mutate, isLoading } = useSWR<ProgramVideo[]>('/api/program-videos', fetcher)
  const [form, setForm] = useState<ProgramVideoForm>({ title: '', link: '', thumbnail: null })
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const hasAccess = session && hasAnyRole(session.user.role, ['DEVELOPER', 'TECHNIC'])

  const handleChange =
    (field: keyof ProgramVideoForm) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      if (field === 'thumbnail') {
        const file: File | null = event.target.files?.[0] ?? null
        setForm((prevForm) => ({ ...prevForm, thumbnail: file }))
        return
      }

      setForm((prevForm) => ({ ...prevForm, [field]: event.target.value }))
    }

  const uploadToR2 = async (file: File): Promise<string> => {
    const res = await fetch('/api/program-videos/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    })
    if (!res.ok) throw new Error('Failed to get upload URL')
    const { uploadUrl, key } = await res.json()
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) throw new Error('Direct upload to R2 failed')
    return key
  }

  const save = async (): Promise<void> => {
    setError('')
    if (!form.title || !form.link || !form.thumbnail) {
      setError('All fields are required')
      return
    }
    setSaving(true)
    let thumbnailKey: string | null = null
    if (form.thumbnail) {
      thumbnailKey = await uploadToR2(form.thumbnail)
    }
    const res = await fetch('/api/program-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        link: form.link,
        thumbnailKey,
      }),
    })
    if (!res.ok) {
      setError('Failed to save')
    } else {
      setForm({ title: '', link: '', thumbnail: null })
      mutate()
    }
    setSaving(false)
  }

  const remove = async (id: ProgramVideoId): Promise<void> => {
    if (!window.confirm('Delete this video?')) return
    await fetch('/api/program-videos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    mutate()
  }

  if (status === 'loading') {
    return <div className="font-body p-8 text-center">Loading...</div>
  }

  if (!hasAccess) {
    return <div className="font-body p-8 text-center text-red-500">Access Denied.</div>
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="font-heading mb-6 text-3xl font-bold text-gray-900">Manage Program Videos</h1>

      {/* Form Tambah Video */}
      <div className="mb-8 space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-md sm:p-8">
        <h2 className="font-heading mb-6 text-xl font-semibold text-gray-800">Add New Video</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="font-body mb-2 block font-semibold text-gray-800">Title</label>
            <input
              className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Title"
              value={form.title}
              onChange={handleChange('title')}
            />
          </div>
          <div>
            <label className="font-body mb-2 block font-semibold text-gray-800">YouTube Link</label>
            <input
              className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="YouTube link"
              value={form.link}
              onChange={handleChange('link')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="font-body mb-2 block font-semibold text-gray-800">Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleChange('thumbnail')}
              className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors file:mr-2 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 hover:file:bg-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="font-body mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}
        <button
          onClick={save}
          className="font-body flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={saving}
        >
          <FiPlus size={18} />
          {saving ? 'Saving…' : 'Add Video'}
        </button>
      </div>

      {/* Daftar Video */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md sm:p-8">
        <h2 className="font-heading mb-6 text-xl font-semibold text-gray-900">All Videos</h2>
        {isLoading ? (
          <div className="font-body py-8 text-center text-gray-700">Loading...</div>
        ) : (
          <ul className="space-y-6">
            {videos && videos.length > 0 ? (
              videos.map((v: ProgramVideo) => (
                <li
                  key={v.id}
                  className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-gray-50 p-6 transition-shadow hover:shadow-md"
                >
                  <img src={v.thumbnail} className="h-20 w-32 rounded object-cover" alt={v.title} />
                  <div className="flex-1">
                    <p className="font-body font-semibold text-gray-800">{v.title}</p>
                    <a
                      href={v.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm text-blue-600 hover:underline"
                    >
                      Watch on YouTube
                    </a>
                  </div>
                  <button
                    onClick={() => remove(v.id)}
                    className="rounded-full p-2 text-red-600 transition-colors hover:bg-red-100 hover:text-red-800"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </li>
              ))
            ) : (
              <div className="font-body py-8 text-center text-gray-700">No videos yet.</div>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
