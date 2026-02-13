'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX } from 'react-icons/fi'
import { hasAnyRole } from '@/lib/roleUtils'

type PodcastId = string | number
type UploadType = 'audio' | 'cover'

interface PodcastItem {
  id: PodcastId
  title: string
  subtitle?: string | null
  description: string
  date?: string | null
  duration?: string | null
  image?: string | null
  coverImage?: string | null
  audioUrl?: string | null
  author?: {
    name?: string | null
  } | null
}

interface PodcastFormState {
  title: string
  subtitle: string
  description: string
  date: string
  duration: string
  audio: File | null
  coverImage: File | null
  image: string
}

interface EditablePodcastState {
  title: string
  subtitle: string
  description: string
  date: string
  duration: string
  image: string
}

interface UploadUrlResponse {
  uploadUrl: string
  key: string
}

const INITIAL_FORM_STATE: PodcastFormState = {
  title: '',
  subtitle: '',
  description: '',
  date: '',
  duration: '',
  audio: null,
  coverImage: null,
  image: '',
}

const INITIAL_EDIT_FORM_STATE: EditablePodcastState = {
  title: '',
  subtitle: '',
  description: '',
  date: '',
  duration: '',
  image: '',
}

function PodcastDashboard() {
  const { data: session, status } = useSession()
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<PodcastFormState>(INITIAL_FORM_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState<PodcastId | null>(null)
  const [editForm, setEditForm] = useState<EditablePodcastState>(INITIAL_EDIT_FORM_STATE)

  const isAdmin = Boolean(session && hasAnyRole(session.user.role, ['DEVELOPER', 'MUSIC']))

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/podcast')
        .then((res) => res.json())
        .then((data: PodcastItem[]) => {
          setPodcasts(data)
          setLoading(false)
        })
        .catch(() => {
          setError('Failed to load podcasts')
          setLoading(false)
        })
    }
  }, [isAdmin])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    switch (name) {
      case 'audio': {
        const file = (e.target as HTMLInputElement).files?.[0] ?? null
        setForm((prev) => ({ ...prev, audio: file }))
        return
      }
      case 'coverImage': {
        const file = (e.target as HTMLInputElement).files?.[0] ?? null
        setForm((prev) => ({ ...prev, coverImage: file }))
        return
      }
      case 'title':
        setForm((prev) => ({ ...prev, title: value }))
        return
      case 'subtitle':
        setForm((prev) => ({ ...prev, subtitle: value }))
        return
      case 'description':
        setForm((prev) => ({ ...prev, description: value }))
        return
      case 'date':
        setForm((prev) => ({ ...prev, date: value }))
        return
      case 'duration':
        setForm((prev) => ({ ...prev, duration: value }))
        return
      case 'image':
        setForm((prev) => ({ ...prev, image: value }))
        return
      default:
        return
    }
  }

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    switch (name) {
      case 'title':
        setEditForm((prev) => ({ ...prev, title: value }))
        return
      case 'subtitle':
        setEditForm((prev) => ({ ...prev, subtitle: value }))
        return
      case 'description':
        setEditForm((prev) => ({ ...prev, description: value }))
        return
      case 'date':
        setEditForm((prev) => ({ ...prev, date: value }))
        return
      case 'duration':
        setEditForm((prev) => ({ ...prev, duration: value }))
        return
      case 'image':
        setEditForm((prev) => ({ ...prev, image: value }))
        return
      default:
        return
    }
  }

  const uploadToR2 = async (file: File, type: UploadType): Promise<string> => {
    const res = await fetch('/api/podcast/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        type,
      }),
    })
    if (!res.ok) throw new Error(`Failed to get upload URL for ${type}`)
    const { uploadUrl, key }: UploadUrlResponse = await res.json()
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) throw new Error(`Direct upload to R2 failed for ${type}`)
    return key
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      let audioKey = null
      let coverImageKey = null
      if (form.audio) {
        audioKey = await uploadToR2(form.audio, 'audio')
      }
      if (form.coverImage) {
        coverImageKey = await uploadToR2(form.coverImage, 'cover')
      }
      const res = await fetch('/api/podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          description: form.description,
          date: form.date,
          duration: form.duration,
          image: form.image,
          audioKey,
          coverImageKey,
        }),
      })
      if (!res.ok) throw new Error('Failed to add podcast')
      const newPodcast: PodcastItem = await res.json()
      setPodcasts((prev) => [newPodcast, ...prev])
      setForm(INITIAL_FORM_STATE)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (podcast: PodcastItem) => {
    setEditId(podcast.id)
    setEditForm({
      title: podcast.title || '',
      subtitle: podcast.subtitle || '',
      description: podcast.description || '',
      date: podcast.date || '',
      duration: podcast.duration || '',
      image: podcast.image || '',
    })
  }

  const handleEditSave = async (id: PodcastId) => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/podcast', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      })
      if (!res.ok) throw new Error('Failed to update podcast')
      const updated: PodcastItem = await res.json()
      setPodcasts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setEditId(null)
      setEditForm(INITIAL_EDIT_FORM_STATE)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: PodcastId) => {
    if (!window.confirm('Delete this podcast?')) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/podcast', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete podcast')
      setPodcasts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return <div className="font-body p-8 text-center">Loading...</div>
  }

  if (!isAdmin) {
    return <div className="font-body p-8 text-center text-red-500">Access Denied.</div>
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="font-heading mb-6 text-3xl font-bold text-gray-900">Podcast Dashboard</h1>

      {isAdmin && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-md sm:p-8"
        >
          <h2 className="font-heading mb-6 text-xl font-semibold text-gray-800">Add New Podcast</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="font-body mb-2 block font-semibold text-gray-800">Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="font-body mb-2 block font-semibold text-gray-800">
                Subtitle (optional)
              </label>
              <input
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-body mb-2 block font-semibold text-gray-800">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="font-body mb-2 block font-semibold text-gray-800">
                Date (e.g. Dec 7, 2024)
              </label>
              <input
                name="date"
                value={form.date}
                onChange={handleChange}
                className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-body mb-2 block font-semibold text-gray-800">
                Duration (e.g. 33 min 40 sec)
              </label>
              <input
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-body mb-2 block font-semibold text-gray-800">
                Image URL (optional, overrides cover image)
              </label>
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-body mb-2 block font-semibold text-gray-800">Audio File</label>
              <input
                name="audio"
                type="file"
                accept="audio/*"
                onChange={handleChange}
                className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors file:mr-2 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 hover:file:bg-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="font-body mb-2 block font-semibold text-gray-800">
                Cover Image (optional)
              </label>
              <input
                name="coverImage"
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors file:mr-2 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 hover:file:bg-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="font-body flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitting}
          >
            <FiPlus size={18} />
            {submitting ? 'Adding...' : 'Add Podcast'}
          </button>
          {error && (
            <div className="font-body mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md sm:p-8">
        <h2 className="font-heading mb-6 text-xl font-semibold text-gray-900">All Podcasts</h2>
        {loading ? (
          <div className="font-body py-8 text-center text-gray-700">Loading...</div>
        ) : error ? (
          <div className="font-body rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        ) : (
          <ul className="space-y-6">
            {podcasts.map((podcast) => (
              <li
                key={podcast.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-6 transition-shadow hover:shadow-md"
              >
                {editId === podcast.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input
                        name="title"
                        value={editForm.title}
                        onChange={handleEditChange}
                        className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        name="subtitle"
                        value={editForm.subtitle}
                        onChange={handleEditChange}
                        className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="md:col-span-2">
                        <textarea
                          name="description"
                          value={editForm.description}
                          onChange={handleEditChange}
                          rows={3}
                          className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <input
                        name="date"
                        value={editForm.date}
                        onChange={handleEditChange}
                        className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        name="duration"
                        value={editForm.duration}
                        onChange={handleEditChange}
                        className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="md:col-span-2">
                        <input
                          name="image"
                          value={editForm.image}
                          onChange={handleEditChange}
                          className="font-body w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleEditSave(podcast.id)}
                        className="font-body flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={submitting}
                      >
                        <FiSave size={16} />
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="font-body flex items-center gap-2 rounded-lg bg-gray-400 px-4 py-2 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500"
                      >
                        <FiX size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-heading mb-2 text-lg font-bold text-gray-900">
                          {podcast.title}
                        </div>
                        {podcast.subtitle && (
                          <div className="font-body mb-2 text-gray-600">{podcast.subtitle}</div>
                        )}
                        <div className="font-body mb-3 text-gray-700">{podcast.description}</div>
                      </div>
                      {isAdmin && (
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => handleEdit(podcast)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(podcast.id)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={submitting}
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="">
                      {(podcast.image || podcast.coverImage || '/8eh-real.svg') && (
                        <img
                          src={podcast.image || podcast.coverImage || '/8eh-real.svg'}
                          alt="cover"
                          className="h-48 w-48 rounded-lg border border-gray-200 object-cover shadow-sm"
                        />
                      )}
                      <div className="mt-4 space-y-3">
                        <audio
                          controls
                          src={
                            podcast.audioUrl
                              ? `/api/proxy-audio?key=${encodeURIComponent(podcast.audioUrl)}`
                              : undefined
                          }
                          className="w-full rounded-lg"
                        />
                        <div className="font-body text-sm text-gray-500">
                          By {podcast.author?.name || 'Unknown'}
                        </div>
                        {podcast.date && (
                          <div className="font-body text-sm text-gray-500">
                            Published: {podcast.date}
                          </div>
                        )}
                        {podcast.duration && (
                          <div className="font-body text-sm text-gray-500">
                            Duration: {podcast.duration}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default PodcastDashboard
