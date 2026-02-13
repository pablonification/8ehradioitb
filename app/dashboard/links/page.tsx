'use client'

import {
  useState,
  useEffect,
  type ChangeEvent,
  type FormEvent,
  type HTMLInputTypeAttribute,
  type MouseEvent,
} from 'react'
import ButtonPrimary from '@/app/components/ButtonPrimary'
import {
  FiCopy,
  FiEdit,
  FiTrash2,
  FiEye,
  FiLink,
  FiCalendar,
  FiBarChart2,
  FiLock,
  FiPlus,
  FiX,
} from 'react-icons/fi'

type ShortLinkId = string | number

interface ShortLinkEntity {
  id: ShortLinkId
  destination: string
  title: string | null
  slug: string
  password: string | null
  isActive: boolean
  createdAt: string
  _count?: {
    clicks: number
  }
}

interface AnalyticsChartItem {
  date: string
  clicks: number
}

interface AnalyticsReferrerItem {
  referer: string
  clicks: number
}

interface AnalyticsPayload {
  totalClicks: number
  chartData?: AnalyticsChartItem[]
  topReferrers?: AnalyticsReferrerItem[]
}

interface FormState {
  destination: string
  title: string
  slug: string
  password: string
}

type FormField = keyof FormState
type ErrorField = FormField | 'general'
type ErrorMap = Partial<Record<ErrorField, string>>

interface AnalyticsModalState {
  isOpen: boolean
  shortLink: ShortLinkEntity | null
  analytics: AnalyticsPayload | null
}

interface FormInputProps {
  label: string
  type?: HTMLInputTypeAttribute
  placeholder?: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  name: FormField
  error?: string
}

function FormInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  error,
}: FormInputProps) {
  return (
    <div>
      <label className="font-body mb-2 block text-sm font-medium text-gray-800">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`font-body w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="font-body mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

interface ShortLinkCardProps {
  shortLink: ShortLinkEntity
  onEdit: (shortLink: ShortLinkEntity) => void
  onDelete: (id: ShortLinkId) => void | Promise<void>
  onViewAnalytics: (shortLink: ShortLinkEntity) => void | Promise<void>
}

function ShortLinkCard({ shortLink, onEdit, onDelete, onViewAnalytics }: ShortLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const fullUrl = `https://8eh.link/${shortLink.slug}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-heading mb-2 font-semibold text-gray-900">
            {shortLink.title || 'Untitled Link'}
          </h3>
          <p className="font-body mb-3 text-sm break-all text-gray-600">{shortLink.destination}</p>
          <div className="flex items-center space-x-2">
            <span className="font-body text-sm font-medium text-blue-600">
              8eh.link/{shortLink.slug}
            </span>
            <button
              onClick={copyToClipboard}
              className="p-1 text-gray-400 transition-colors hover:text-gray-600"
            >
              <FiCopy size={16} />
            </button>
            {copied && <span className="font-body text-xs text-green-600">Copied!</span>}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onViewAnalytics(shortLink)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="View Analytics"
          >
            <FiBarChart2 size={18} />
          </button>
          <button
            onClick={() => onEdit(shortLink)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Edit"
          >
            <FiEdit size={18} />
          </button>
          <button
            onClick={() => onDelete(shortLink.id)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>
      <div className="font-body flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <FiEye size={14} />
            <span>{shortLink._count?.clicks || 0} clicks</span>
          </span>
          <span className="flex items-center space-x-1">
            <FiCalendar size={14} />
            <span>{new Date(shortLink.createdAt).toLocaleDateString()}</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {shortLink.password && (
            <span className="font-body flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
              <FiLock size={12} />
              Protected
            </span>
          )}
          <span
            className={`font-body rounded-full px-2 py-1 text-xs ${shortLink.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {shortLink.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  )
}

interface AnalyticsModalProps {
  shortLink: ShortLinkEntity | null
  analytics: AnalyticsPayload | null
  isOpen: boolean
  onClose: () => void
}

function AnalyticsModal({ shortLink, analytics, isOpen, onClose }: AnalyticsModalProps) {
  if (!isOpen || !shortLink || !analytics) return null

  // Close modal if click on backdrop
  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(17,24,39,0.25)', // Tailwind's gray-900 with 25% opacity
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Analytics for {shortLink.title || 'Untitled Link'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-heading mb-2 font-semibold text-gray-900">Total Clicks</h3>
              <p className="font-body text-2xl font-bold text-blue-600">{analytics.totalClicks}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-heading mb-2 font-semibold text-gray-900">Short URL</h3>
              <p className="font-body text-sm break-all text-gray-600">8eh.link/{shortLink.slug}</p>
            </div>
          </div>

          {analytics.chartData && analytics.chartData.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-heading mb-4 font-semibold text-gray-900">Clicks Over Time</h3>
              <div className="space-y-2">
                {analytics.chartData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded border border-gray-100 bg-white p-2"
                  >
                    <span className="font-body text-sm text-gray-600">{item.date}</span>
                    <span className="font-body text-sm font-medium text-gray-900">
                      {item.clicks} clicks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.topReferrers && analytics.topReferrers.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-heading mb-4 font-semibold text-gray-900">Top Referrers</h3>
              <div className="space-y-2">
                {analytics.topReferrers.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded border border-gray-100 bg-white p-2"
                  >
                    <span className="font-body truncate text-sm text-gray-600">{item.referer}</span>
                    <span className="font-body text-sm font-medium text-gray-900">
                      {item.clicks} clicks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LinksDashboardPage() {
  const [formData, setFormData] = useState<FormState>({
    destination: '',
    title: '',
    slug: '',
    password: '',
  })
  const [shortLinks, setShortLinks] = useState<ShortLinkEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ErrorMap>({})
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<ShortLinkId | null>(null)
  const [analyticsModal, setAnalyticsModal] = useState<AnalyticsModalState>({
    isOpen: false,
    shortLink: null,
    analytics: null,
  })

  useEffect(() => {
    fetchShortLinks()
  }, [])

  const fetchShortLinks = async () => {
    try {
      const response = await fetch('/api/shortlinks')
      if (response.ok) {
        const data: ShortLinkEntity[] = await response.json()
        setShortLinks(data)
      }
    } catch (error) {
      console.error('Error fetching short links:', error)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const fieldName = name as FormField

    setFormData((prev) => ({ ...prev, [fieldName]: value }))
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: '' }))
    }
  }

  const validateForm = (): ErrorMap => {
    const newErrors: ErrorMap = {}
    if (!formData.destination) {
      newErrors.destination = 'Destination URL is required'
    } else {
      try {
        new URL(formData.destination)
      } catch {
        newErrors.destination = 'Please enter a valid URL'
      }
    }
    // Slug tidak boleh kosong saat edit
    if ((isEditing && !formData.slug) || (!isEditing && formData.slug === '')) {
      newErrors.slug = 'Custom back-half cannot be empty'
    }
    return newErrors
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const url = isEditing ? `/api/shortlinks` : '/api/shortlinks'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing ? { ...formData, id: editingId } : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        await response.json()
        await fetchShortLinks()
        resetForm()
      } else {
        const errorData = await response.json()
        if (errorData.error === 'Custom back-half already exists') {
          setErrors({ slug: 'This custom back-half is already taken' })
        } else {
          setErrors({ general: errorData.error || 'Something went wrong' })
        }
      }
    } catch (error) {
      console.error('Error saving short link:', error)
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (shortLink: ShortLinkEntity) => {
    setFormData({
      destination: shortLink.destination,
      title: shortLink.title || '',
      slug: shortLink.slug,
      password: shortLink.password || '',
    })
    setIsEditing(true)
    setEditingId(shortLink.id)
    setErrors({})
  }

  const handleDelete = async (id: ShortLinkId) => {
    if (!confirm('Are you sure you want to delete this short link?')) return

    try {
      const response = await fetch(`/api/shortlinks/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchShortLinks()
      } else {
        console.error('Error deleting short link')
      }
    } catch (error) {
      console.error('Error deleting short link:', error)
    }
  }

  const handleViewAnalytics = async (shortLink: ShortLinkEntity) => {
    try {
      const response = await fetch(`/api/shortlinks/${shortLink.id}/analytics`)
      if (response.ok) {
        const analytics: AnalyticsPayload = await response.json()
        setAnalyticsModal({ isOpen: true, shortLink, analytics })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      destination: '',
      title: '',
      slug: '',
      password: '',
    })
    setIsEditing(false)
    setEditingId(null)
    setErrors({})
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-md sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Short Link' : 'Create a Short Link'}
          </h1>
          {isEditing && (
            <button
              onClick={resetForm}
              className="font-body flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <FiX size={16} /> Cancel Edit
            </button>
          )}
        </div>

        {isEditing && (
          <div className="mb-6 rounded-lg border border-pink-200 bg-pink-50 p-3">
            <div className="flex items-center">
              <FiEdit className="mr-2 h-5 w-5 text-pink-600" />
              <span className="font-body font-medium text-pink-800">
                Editing: {formData.title || 'Untitled Link'}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="font-body space-y-6 text-gray-900">
          <FormInput
            label="Destination URL"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            placeholder="https://8ehradioitb.com/example"
            error={errors.destination}
          />
          <FormInput
            label="Title (optional)"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Website 8EH"
          />
          <div>
            <label className="font-body mb-2 block text-sm font-medium text-gray-800">
              Customization
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value="8eh.link"
                readOnly
                className="font-body w-1/3 cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500"
              />
              <span className="font-body text-gray-500">/</span>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="custom-back-half"
                className={`font-body flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.slug ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.slug && <p className="font-body mt-1 text-sm text-red-600">{errors.slug}</p>}
          </div>
          <FormInput
            label="Password (optional)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="**********"
          />
          {errors.general && <p className="font-body text-sm text-red-600">{errors.general}</p>}
          <div className="flex justify-end pt-4">
            <ButtonPrimary type="submit" disabled={loading} className="!flex !items-center !gap-2">
              <FiPlus size={16} />
              {loading ? 'Saving...' : isEditing ? 'Update Link' : 'Create Link'}
            </ButtonPrimary>
          </div>
        </form>
      </div>

      {shortLinks.length > 0 && (
        <div>
          <h2 className="font-heading mb-6 text-xl font-bold text-gray-800">All Short Links</h2>
          <div className="space-y-4">
            {shortLinks.map((shortLink) => (
              <ShortLinkCard
                key={shortLink.id}
                shortLink={shortLink}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewAnalytics={handleViewAnalytics}
              />
            ))}
          </div>
        </div>
      )}

      <AnalyticsModal
        shortLink={analyticsModal.shortLink}
        analytics={analyticsModal.analytics}
        isOpen={analyticsModal.isOpen}
        onClose={() => setAnalyticsModal({ isOpen: false, shortLink: null, analytics: null })}
      />
    </div>
  )
}
