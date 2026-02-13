'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi'
import { hasAnyRole } from '@/lib/roleUtils'

type StreamConfig = {
  baseUrls: string[]
  defaultUrl: string
  fallbackUrl: string
  onAir: boolean
}

type StreamConfigChangeEvent =
  | ChangeEvent<HTMLSelectElement>
  | { target: { name: 'onAir'; checked: boolean } }

export default function StreamConfigPage() {
  const { data: session, status } = useSession()
  const [config, setConfig] = useState<StreamConfig>({
    baseUrls: [],
    defaultUrl: '',
    fallbackUrl: '',
    onAir: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [newUrl, setNewUrl] = useState('')

  const isAdmin = session && hasAnyRole(session.user.role, ['DEVELOPER', 'TECHNIC'])

  useEffect(() => {
    fetch('/api/stream-config')
      .then((res) => res.json())
      .then((data) => {
        setConfig({
          baseUrls: data?.baseUrls || [],
          defaultUrl: data?.defaultUrl || '',
          fallbackUrl: data?.fallbackUrl || '',
          onAir: typeof data?.onAir === 'boolean' ? data.onAir : true,
        })
      })
      .catch(() => {
        setError('Failed to load configuration. Please try again.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleAddUrl = () => {
    if (newUrl && !config.baseUrls.includes(newUrl)) {
      try {
        // Validate URL format before adding
        new URL(newUrl)
        setConfig((prev) => ({ ...prev, baseUrls: [...prev.baseUrls, newUrl] }))
        setNewUrl('')
        setError('')
      } catch {
        setError('Invalid URL format. Please enter a valid URL.')
      }
    }
  }

  const handleRemoveUrl = (urlToRemove: string) => {
    setConfig((prev) => ({
      ...prev,
      baseUrls: prev.baseUrls.filter((u) => u !== urlToRemove),
      defaultUrl: prev.defaultUrl === urlToRemove ? '' : prev.defaultUrl,
      fallbackUrl: prev.fallbackUrl === urlToRemove ? '' : prev.fallbackUrl,
    }))
  }

  const handleChange = (e: StreamConfigChangeEvent) => {
    const { target } = e
    if ('checked' in target) {
      setConfig((prev) => ({
        ...prev,
        onAir: target.checked,
      }))
      return
    }

    if (target.name !== 'defaultUrl' && target.name !== 'fallbackUrl') {
      return
    }

    setConfig((prev) => ({
      ...prev,
      [target.name]: target.value,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/stream-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Failed to save configuration.')
      setSuccess('Configuration saved successfully!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration.')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="font-body p-8 text-center">Loading...</div>
  }

  if (!isAdmin) {
    return <div className="font-body p-8 text-center text-red-600">Access Denied.</div>
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-800">Stream Configuration</h1>
        <p className="font-body mt-1 text-gray-600">
          Manage live streaming URLs and broadcast status.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-8 shadow-md">
        {/* Base URLs Section */}
        <div>
          <label className="font-body mb-2 block font-semibold text-gray-700">Stream URLs</label>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="font-body w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="https://your-stream-url.com/stream"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="font-body flex flex-shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-green-700"
            >
              <FiPlus />
              Add
            </button>
          </div>
          <ul className="font-body space-y-2">
            {config.baseUrls.length > 0 ? (
              config.baseUrls.map((url) => (
                <li
                  key={url}
                  className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 shadow-sm"
                >
                  <span className="flex-1 text-sm break-all text-gray-800">{url}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUrl(url)}
                    className="cursor-pointer rounded-full p-1 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </li>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-gray-500">No URLs added yet.</p>
            )}
          </ul>
        </div>

        {/* Default and Fallback URLs */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="defaultUrl"
              className="font-body mb-2 block font-semibold text-gray-700"
            >
              Default URL
            </label>
            <select
              id="defaultUrl"
              name="defaultUrl"
              value={config.defaultUrl}
              onChange={handleChange}
              className="font-body w-full cursor-pointer rounded-md border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select default stream</option>
              {config.baseUrls.map((url) => (
                <option key={url} value={url}>
                  {url}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="fallbackUrl"
              className="font-body mb-2 block font-semibold text-gray-700"
            >
              Fallback URL
            </label>
            <select
              id="fallbackUrl"
              name="fallbackUrl"
              value={config.fallbackUrl}
              onChange={handleChange}
              className="font-body w-full cursor-pointer rounded-md border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select fallback stream</option>
              {config.baseUrls.map((url) => (
                <option key={url} value={url}>
                  {url}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* On Air Status */}
        <div>
          <label className="font-body mb-2 block font-semibold text-gray-700">
            Broadcast Status
          </label>
          <div className="flex items-center gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <span className="font-body text-gray-700">Radio is currently:</span>
            <button
              type="button"
              role="switch"
              aria-checked={!!config.onAir}
              onClick={() =>
                handleChange({
                  target: { name: 'onAir', checked: !config.onAir },
                })
              }
              className={`relative inline-flex h-7 w-14 cursor-pointer items-center rounded-full border transition-colors duration-300 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                config.onAir
                  ? 'border-green-600 bg-green-500 focus:ring-green-500'
                  : 'border-gray-400 bg-gray-300 focus:ring-gray-400'
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-300 ease-in-out ${
                  config.onAir ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
              <span className="sr-only">{config.onAir ? 'Turn off' : 'Turn on'} broadcast</span>
            </button>
            <span
              className={`font-body text-sm font-semibold ${config.onAir ? 'text-green-600' : 'text-gray-500'}`}
            >
              {config.onAir ? 'On Air' : 'Off Air'}
            </span>
          </div>
        </div>

        {error && (
          <div className="font-body rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="font-body rounded-md bg-green-50 p-3 text-sm text-green-600">
            {success}
          </div>
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
