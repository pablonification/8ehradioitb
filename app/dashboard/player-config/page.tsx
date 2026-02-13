'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import clsx from 'clsx'
import { FiUpload, FiSave, FiTrash2 } from 'react-icons/fi'
import { hasAnyRole } from '@/lib/roleUtils'

type PlayerConfig = {
  title: string
  coverImage: string
}

type PlayerConfigResponse = {
  title?: string
  coverImage?: string
  coverImages?: string[]
}

type UploadUrlResponse = {
  uploadUrl: string
  url: string
}

export default function PlayerConfigPage() {
  const { data: session } = useSession()
  const [config, setConfig] = useState<PlayerConfig>({ title: '', coverImage: '' })
  const [coverImages, setCoverImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const isAdmin = session && hasAnyRole(session.user.role, ['DEVELOPER', 'TECHNIC'])

  useEffect(() => {
    fetch('/api/player-config')
      .then((res) => res.json())
      .then((data: PlayerConfigResponse) => {
        setConfig({
          title: data?.title || '',
          coverImage: data?.coverImage || '/8eh.png',
        })
        let covers: string[] = data?.coverImages || []
        if (!covers.includes('/8eh.png')) covers = ['/8eh.png', ...covers]
        else covers = ['/8eh.png', ...covers.filter((c) => c !== '/8eh.png')]
        setCoverImages(covers)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load config')
        setLoading(false)
      })
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({ ...prev, [name as keyof PlayerConfig]: value }))
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSuccess('')
    // Step 1: Get pre-signed URL from API
    const res = await fetch('/api/player-config/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    })
    if (!res.ok) throw new Error('Failed to get upload URL')
    const { uploadUrl, url }: UploadUrlResponse = await res.json()
    // Step 2: Upload file directly to R2
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) throw new Error('Direct upload to R2 failed')
    if (!coverImages.includes(url)) {
      setCoverImages((prev) => [...prev, url])
    }
    setConfig((prev) => ({ ...prev, coverImage: url }))
    await fetch('/api/player-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addCoverImage: url, title: config.title, coverImage: url }),
    })
    setSuccess('Image uploaded!')
  }

  const handleSelectCover = (url: string) => {
    setConfig((prev) => ({ ...prev, coverImage: url }))
    setSuccess('')
  }

  const handleDeleteCover = async (url: string) => {
    if (url === '/8eh.png' || !window.confirm('Are you sure you want to delete this image?')) return
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/player-config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error('Failed to delete image')
      setCoverImages((prev) => prev.filter((img) => img !== url))
      setConfig((prev) => ({
        ...prev,
        coverImage: prev.coverImage === url ? '/8eh.png' : prev.coverImage,
      }))
      setSuccess('Image deleted.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/player-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Failed to save config')
      setSuccess('Config saved successfully!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) return <div className="font-body p-8 text-center text-red-500">Access Denied.</div>
  if (loading) return <div className="font-body p-8 text-center">Loading...</div>

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading mb-6 text-3xl font-bold text-gray-800">Player Configuration</h1>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-md">
        <div>
          <label htmlFor="title" className="font-body mb-2 block font-semibold text-gray-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            value={config.title}
            onChange={handleChange}
            className="font-body w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Now Playing: Hits of the Week"
            required
          />
        </div>
        <div>
          <label className="font-body mb-2 block font-semibold text-gray-700">Cover Images</label>
          <label
            htmlFor="cover-upload"
            className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-blue-500 hover:bg-gray-50"
          >
            <FiUpload className="text-gray-500" />
            <span className="font-body text-gray-600">Upload New Image</span>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {coverImages.map((url) => (
              <div
                key={url}
                className={clsx(
                  'group relative aspect-square cursor-pointer rounded-lg bg-white p-1 shadow-sm transition-all hover:shadow-md',
                  config.coverImage === url
                    ? 'border-2 border-blue-600 ring-2 ring-blue-200'
                    : 'border border-gray-300 hover:border-gray-400'
                )}
                onClick={() => handleSelectCover(url)}
              >
                <img src={url} alt="cover" className="h-full w-full rounded object-cover" />
                {url !== '/8eh.png' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCover(url)
                    }}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                  >
                    <FiTrash2 size={12} />
                  </button>
                )}
                {config.coverImage === url && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                    <span className="text-xs font-bold text-white">Active</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="font-body mt-2 rounded-md bg-red-50 p-3 text-red-600">{error}</div>
        )}
        {success && (
          <div className="font-body mt-2 rounded-md bg-green-50 p-3 text-green-600">{success}</div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            className="font-body flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving}
          >
            <FiSave />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}
