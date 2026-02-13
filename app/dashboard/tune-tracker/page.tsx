'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState, type ChangeEvent } from 'react'
import { FiSave, FiUpload, FiX, FiMusic } from 'react-icons/fi'
import { hasAnyRole } from '@/lib/roleUtils'

const MAX_ENTRIES = 10

interface TuneTrackerEntry {
  id?: string | number
  order: number
  title: string
  artist: string
  coverImage: string | File | null
  audioUrl: string | File | null
}

interface TuneEntryFormProps {
  initialEntry: TuneTrackerEntry
  onSaveSuccess?: () => void
}

type TuneFileField = 'coverImage' | 'audioUrl'
type TuneEditableField = 'title' | 'artist' | TuneFileField

interface UploadResponse {
  uploadUrl: string
  key: string
}

// Komponen untuk satu baris entri lagu
function TuneEntryForm({ initialEntry, onSaveSuccess }: TuneEntryFormProps) {
  const [entry, setEntry] = useState<TuneTrackerEntry>(initialEntry)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = <K extends TuneEditableField>(field: K, value: TuneTrackerEntry[K]) => {
    setEntry((prev) => ({ ...prev, [field]: value }))
    setSuccess('')
    setError('')
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: TuneFileField) => {
    const file = e.target.files?.[0]
    if (file) {
      handleChange(field, file)
    }
  }

  const handleRemoveFile = async (field: TuneFileField) => {
    setError('')
    setSuccess('')
    if (!entry.id) {
      handleChange(field, '')
      return
    }
    try {
      const res = await fetch('/api/tune-tracker', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, field }),
      })
      if (!res.ok) throw new Error('Failed to remove file.')
      handleChange(field, null) // Clear the file field
      setSuccess('File removed.')
      onSaveSuccess?.() // Refresh parent state
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove file.')
    }
  }

  const uploadFile = async (file: File, type: 'cover' | 'audio') => {
    // Step 1: Get pre-signed URL from API
    const res = await fetch('/api/tune-tracker/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        type,
      }),
    })
    if (!res.ok) throw new Error(`Failed to get upload URL for ${type}`)
    const { uploadUrl, key }: UploadResponse = await res.json()

    // Step 2: Upload file directly to R2
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) throw new Error(`Direct upload to R2 failed for ${type}`)
    return key
  }

  const handleSave = async () => {
    if (!entry.title || !entry.artist) {
      setError('Song Title and Artist are required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')

    const finalPayload: TuneTrackerEntry = { ...entry }

    try {
      if (entry.coverImage instanceof File) {
        const coverUrl = await uploadFile(entry.coverImage, 'cover')
        finalPayload.coverImage = coverUrl
      }
      if (entry.audioUrl instanceof File) {
        const audioUrl = await uploadFile(entry.audioUrl, 'audio')
        finalPayload.audioUrl = audioUrl
      }

      const res = await fetch('/api/tune-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      })

      if (!res.ok) throw new Error('Failed to save entry.')
      setSuccess('Entry saved successfully!')
      if (onSaveSuccess) onSaveSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-md md:flex-row">
      <div className="font-heading w-12 flex-shrink-0 pt-2 text-3xl font-bold text-gray-400">
        {String(entry.order).padStart(2, '0')}
      </div>

      <div className="w-full flex-1">
        {error && (
          <div className="font-body mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="font-body mb-3 rounded-md bg-green-50 p-3 text-sm text-green-600">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="font-body mb-1 block text-sm font-semibold text-gray-700">
              Song Title
            </label>
            <input
              className="font-body w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              value={entry.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>
          <div>
            <label className="font-body mb-1 block text-sm font-semibold text-gray-700">
              Artist
            </label>
            <input
              className="font-body w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500"
              value={entry.artist || ''}
              onChange={(e) => handleChange('artist', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-body mb-1 block text-sm font-semibold text-gray-700">
              Cover Image
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'coverImage')}
                  className="hidden"
                />
                <div className="font-body flex w-full cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50">
                  <FiUpload />
                  <span className="truncate text-sm">
                    {entry.coverImage instanceof File ? entry.coverImage.name : 'Choose file...'}
                  </span>
                </div>
              </label>
              {typeof entry.coverImage === 'string' && entry.coverImage && (
                <>
                  <img
                    src={`/api/proxy-audio?key=${encodeURIComponent(entry.coverImage)}`}
                    alt="cover"
                    className="h-12 w-12 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    className="cursor-pointer rounded-full p-2 text-red-500 hover:bg-red-100 hover:text-red-700"
                    onClick={() => handleRemoveFile('coverImage')}
                  >
                    <FiX />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="font-body mb-1 block text-sm font-semibold text-gray-700">
              Audio Clip (Preview)
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e, 'audioUrl')}
                  className="hidden"
                />
                <div className="font-body flex w-full cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50">
                  <FiMusic />
                  <span className="truncate text-sm">
                    {entry.audioUrl instanceof File ? entry.audioUrl.name : 'Choose file...'}
                  </span>
                </div>
              </label>
              {typeof entry.audioUrl === 'string' && entry.audioUrl && (
                <div className="mt-1 flex items-center gap-3">
                  <audio
                    src={`/api/proxy-audio?key=${encodeURIComponent(entry.audioUrl)}`}
                    controls
                    className="h-10 rounded-md"
                  />
                  <button
                    type="button"
                    className="cursor-pointer rounded-full p-2 text-red-500 hover:bg-red-100 hover:text-red-700"
                    onClick={() => handleRemoveFile('audioUrl')}
                  >
                    <FiX />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full pt-2 md:w-auto md:pt-8">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-red-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400 md:w-auto"
          onClick={handleSave}
          disabled={saving}
        >
          <FiSave />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// Komponen utama halaman
export default function TuneTrackerDashboard() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<TuneTrackerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isMusic = session && hasAnyRole(session.user.role, ['MUSIC', 'DEVELOPER'])

  const fetchEntries = async () => {
    if (!loading) setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tune-tracker')
      const data: TuneTrackerEntry[] = await res.json()
      const filled: TuneTrackerEntry[] = Array.from(
        { length: MAX_ENTRIES },
        (_, i): TuneTrackerEntry => {
          const found = data.find((e) => e.order === i + 1)
          return (
            found || {
              order: i + 1,
              title: '',
              artist: '',
              coverImage: null,
              audioUrl: null,
              id: undefined,
            }
          )
        }
      )
      setEntries(filled)
    } catch (err) {
      setError('Failed to load entries. Please refresh the page.')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isMusic) {
      fetchEntries()
    }
  }, [isMusic])

  if (!isMusic) {
    return <div className="font-body p-8 text-center text-red-500">Access Denied.</div>
  }

  if (loading) {
    return <div className="font-body p-8 text-center">Loading entries...</div>
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="font-heading mb-2 text-3xl font-bold text-gray-900">Tune Tracker Editor</h1>
        <p className="font-body text-gray-600">
          Edit the top 10 music charts. Each entry is saved individually.
        </p>
      </div>

      {error && (
        <div className="font-body mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {entries.map((entry) => (
          <TuneEntryForm key={entry.order} initialEntry={entry} onSaveSuccess={fetchEntries} />
        ))}
      </div>
    </div>
  )
}
