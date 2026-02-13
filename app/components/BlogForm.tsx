'use client'

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import AIAssistModal from './ai/AIAssistModal'

const fetcher = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json())

function generateSlug(title: string): string {
  if (!title) return ''
  return title
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
}

const CATEGORY_OPTIONS = ['News', 'Event', 'Achievement', 'Artikel', 'Custom']
type ToastType = 'error' | 'success' | 'warning'
type AIAction = 'title' | 'outline' | 'draft' | 'improve' | 'translate'

interface ToastState {
  message: string
  type: ToastType
}

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
}

interface BlogPostFormState {
  title: string
  slug: string
  content: string
  category: string
  description: string
  readTime: string
  tags: string
  mainImage: string
}

type BlogPostState = BlogPostFormState & Record<string, unknown>

interface BlogAuthor {
  user: {
    id: string
  }
}

interface InitialPost extends Omit<BlogPostFormState, 'readTime' | 'tags'> {
  readTime?: string | number | null
  tags?: string[] | null
  authors?: BlogAuthor[]
}

interface BlogFormProps {
  post?: InitialPost | null
  isEditing?: boolean
}

interface UserOption {
  id: string
  name: string | null
  email: string | null
}

interface CloudinaryUploadResponse {
  secure_url?: string
}

interface ApiErrorResponse {
  error?: string
}

interface AISummaryResponse {
  description: string
}

interface AITagsResponse {
  tags: string
}

const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Unknown error'

// Toast Notification Component
function Toast({ message, type = 'error', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor =
    type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-orange-500'
  const icon =
    type === 'error' ? (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ) : type === 'success' ? (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bgColor} animate-slide-in flex max-w-md items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg`}
    >
      {icon}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 transition-colors hover:bg-white/20"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

export default function BlogForm({ post: initialPost, isEditing = false }: BlogFormProps) {
  const [post, setPost] = useState<BlogPostState>({
    title: '',
    slug: '',
    content: '',
    category: '',
    description: '',
    readTime: '',
    tags: '',
    mainImage: '',
  })
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [customCategory, setCustomCategory] = useState('')
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false)
  const [aiInitialText, setAiInitialText] = useState('')
  const [aiDefaultAction, setAiDefaultAction] = useState<AIAction>('outline')
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isGeneratingTags, setIsGeneratingTags] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const router = useRouter()
  const contentRef = useRef<HTMLTextAreaElement | null>(null)
  const authorDropdownRef = useRef<HTMLDivElement | null>(null)
  const { data: session } = useSession()
  const { data: users, error: usersError } = useSWR<UserOption[]>('/api/users', fetcher)

  const showToast = (message: string, type: ToastType = 'error') => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast(null)
  }

  useEffect(() => {
    if (session && !isEditing) setSelectedAuthors([session.user.id])
    if (isEditing && initialPost) {
      const { tags, readTime, category, authors } = initialPost
      const parsedReadTime = readTime ? String(parseInt(String(readTime), 10) || '') : ''
      setPost({
        ...initialPost,
        tags: Array.isArray(tags) ? tags.join(', ') : '',
        readTime: parsedReadTime,
      })
      if (authors) setSelectedAuthors(authors.map((a) => a.user.id))
      if (category && !CATEGORY_OPTIONS.includes(category)) {
        setIsCustomCategory(true)
        setCustomCategory(category)
      }
    }
  }, [initialPost, isEditing, session])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        authorDropdownRef.current &&
        event.target instanceof Node &&
        !authorDropdownRef.current.contains(event.target)
      ) {
        setIsAuthorDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [authorDropdownRef])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    if (name === 'category') {
      const custom = value === 'Custom'
      setIsCustomCategory(custom)
      setPost((prev) => ({ ...prev, category: custom ? '' : value }))
      if (!custom) setCustomCategory('')
    } else {
      const fieldName = name as keyof BlogPostFormState
      setPost((prev) => ({ ...prev, [fieldName]: value }))
      if (name === 'title') setPost((prev) => ({ ...prev, slug: generateSlug(value) }))
    }
  }

  const handleAuthorChange = (userId: string) => {
    setSelectedAuthors((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageFile(e.target.files?.[0] ?? null)
  }

  const handleContentImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )
      const data: CloudinaryUploadResponse = await res.json()
      if (data.secure_url) {
        const markdownImage = `\n![${file.name}](${data.secure_url})\n`
        const textarea = contentRef.current!
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent =
          post.content.substring(0, start) + markdownImage + post.content.substring(end)
        setPost((prev) => ({ ...prev, content: newContent }))
        showToast('Gambar berhasil diupload!', 'success')
      } else {
        throw new Error('Image upload failed to return a secure URL.')
      }
    } catch (err) {
      showToast('Gagal upload gambar: ' + getErrorMessage(err), 'error')
    }
    // Clear the file input
    e.target.value = ''
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (selectedAuthors.length === 0) {
      showToast('Pilih minimal satu author untuk post ini.', 'warning')
      return
    }

    setIsSubmitting(true)

    let imageUrl = post.mainImage
    if (imageFile) {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )
        const data: CloudinaryUploadResponse = await res.json()
        if (data.secure_url) {
          imageUrl = data.secure_url
        } else {
          throw new Error('Image upload failed')
        }
      } catch (err) {
        showToast('Gagal upload cover image: ' + getErrorMessage(err), 'error')
        setIsSubmitting(false)
        return
      }
    }

    const postCategory = isCustomCategory ? customCategory : post.category
    if (!postCategory) {
      showToast('Pilih atau masukkan category untuk post ini.', 'warning')
      setIsSubmitting(false)
      return
    }

    const postData = {
      ...post,
      mainImage: imageUrl,
      tags: post.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      readTime: post.readTime ? `${post.readTime} min read` : null,
      category: postCategory,
      authorIds: selectedAuthors,
    }

    const url = isEditing ? `/api/blog/${initialPost!.slug}` : '/api/blog'
    const method = isEditing ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      })

      if (!res.ok) {
        const errorData: ApiErrorResponse = await res.json()
        throw new Error(errorData.error || 'Failed to save post')
      }

      router.push('/dashboard/blog')
      router.refresh()
    } catch (err) {
      showToast('Gagal menyimpan post: ' + getErrorMessage(err), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // AI Helper Functions
  const handleOpenAIModal = (initialText = '') => {
    setAiInitialText(initialText)
    setAiDefaultAction('outline')
    setIsAIModalOpen(true)
  }

  const handleOpenTitleModal = () => {
    setAiInitialText('')
    setAiDefaultAction('title')
    setIsTitleModalOpen(true)
  }

  const handleAIInsert = (text: string) => {
    // Insert at cursor position or append to content
    const textarea = contentRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = post.content.substring(0, start) + text + post.content.substring(end)
      setPost((prev) => ({ ...prev, content: newContent }))
    } else {
      setPost((prev) => ({ ...prev, content: prev.content + '\n' + text }))
    }
  }

  const handleTitleInsert = (text: string) => {
    // Clean up the title (remove quotes, extra whitespace)
    const cleanTitle = text.trim().replace(/^["']|["']$/g, '')
    setPost((prev) => ({
      ...prev,
      title: cleanTitle,
      slug: generateSlug(cleanTitle),
    }))
  }

  const handleAutoDescription = async () => {
    if (!post.content || post.content.length < 100) {
      showToast(
        'Isi Content terlebih dahulu (minimal 100 karakter) untuk generate description otomatis.',
        'warning'
      )
      return
    }

    setIsGeneratingDescription(true)
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.content }),
      })

      if (!res.ok) {
        const error: ApiErrorResponse = await res.json()
        throw new Error(error.error || 'Failed to generate description')
      }

      const data: AISummaryResponse = await res.json()
      setPost((prev) => ({ ...prev, description: data.description }))
      showToast('Description berhasil di-generate!', 'success')
    } catch (err) {
      showToast('Gagal generate description: ' + getErrorMessage(err), 'error')
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const handleAutoTags = async () => {
    if (!post.content || post.content.length < 50) {
      showToast(
        'Isi Content terlebih dahulu (minimal 50 karakter) untuk generate tags otomatis.',
        'warning'
      )
      return
    }

    setIsGeneratingTags(true)
    try {
      const res = await fetch('/api/ai/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.content, title: post.title }),
      })

      if (!res.ok) {
        const error: ApiErrorResponse = await res.json()
        throw new Error(error.error || 'Failed to generate tags')
      }

      const data: AITagsResponse = await res.json()
      setPost((prev) => ({ ...prev, tags: data.tags }))
      showToast('Tags berhasil di-generate!', 'success')
    } catch (err) {
      showToast('Gagal generate tags: ' + getErrorMessage(err), 'error')
    } finally {
      setIsGeneratingTags(false)
    }
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-md sm:p-8"
      >
        {/* Title & Slug */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="title"
                className="font-body mb-2 block text-sm font-medium text-gray-800"
              >
                Title
              </label>
              <button
                type="button"
                onClick={handleOpenTitleModal}
                className="font-body flex items-center gap-1 text-sm font-medium text-orange-600 transition-colors hover:text-orange-700"
              >
                <span>💡</span> AI Title
              </button>
            </div>
            <input
              type="text"
              name="title"
              id="title"
              value={post.title}
              onChange={handleChange}
              className="font-body mt-1 block w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="slug"
              className="font-body mb-2 block text-sm font-medium text-gray-800"
            >
              Slug
            </label>
            <input
              type="text"
              name="slug"
              id="slug"
              value={post.slug}
              onChange={handleChange}
              className="font-body mt-1 block w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 p-3 text-gray-500"
              readOnly
            />
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="content"
              className="font-body mb-2 block text-sm font-medium text-gray-800"
            >
              Content (Markdown)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenAIModal(post.title || '')}
                className="font-body flex items-center gap-1 text-sm font-medium text-orange-600 transition-colors hover:text-orange-700"
              >
                <span>✨</span> AI Assist
              </button>
              <label className="font-body cursor-pointer text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
                Add Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleContentImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <textarea
            name="content"
            id="content"
            ref={contentRef}
            rows={15}
            value={post.content}
            onChange={handleChange}
            className="font-body mt-1 block w-full rounded-md border border-gray-300 bg-white p-3 font-mono text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            required
          ></textarea>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="description"
              className="font-body mb-2 block text-sm font-medium text-gray-800"
            >
              Description
            </label>
            <button
              type="button"
              onClick={handleAutoDescription}
              disabled={isGeneratingDescription}
              className="font-body flex items-center gap-1 text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 disabled:opacity-50"
            >
              {isGeneratingDescription ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <span>✨</span> Auto-fill
                </>
              )}
            </button>
          </div>
          <input
            type="text"
            name="description"
            id="description"
            value={post.description}
            onChange={handleChange}
            className="font-body mt-1 block w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Authors */}
        <div className="relative" ref={authorDropdownRef}>
          <label className="font-body mb-2 block text-sm font-medium text-gray-800">Authors</label>
          <button
            type="button"
            onClick={() => setIsAuthorDropdownOpen(!isAuthorDropdownOpen)}
            className="font-body mt-1 block w-full rounded-md border border-gray-300 bg-white p-3 text-left text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            {selectedAuthors.length > 0
              ? `${selectedAuthors.length} author(s) selected`
              : 'Select authors...'}
          </button>
          {isAuthorDropdownOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
              {usersError && <p className="font-body p-4 text-red-700">Failed to load users.</p>}
              {!users && !usersError && (
                <p className="font-body p-4 text-gray-700">Loading users...</p>
              )}
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center border-b border-gray-100 p-3 last:border-b-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id={`author-${user.id}`}
                    checked={selectedAuthors.includes(user.id)}
                    onChange={() => handleAuthorChange(user.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`author-${user.id}`}
                    className="font-body ml-3 block flex-1 cursor-pointer text-sm text-gray-900"
                  >
                    {user.name} <span className="text-gray-500">({user.email})</span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category, Custom Category, Read Time */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="category"
              className="font-body mb-2 block text-sm font-medium text-gray-800"
            >
              Category
            </label>
            <select
              name="category"
              id="category"
              value={isCustomCategory ? 'Custom' : post.category}
              onChange={handleChange}
              className="font-body mt-1 block w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          {isCustomCategory && (
            <div>
              <label
                htmlFor="customCategory"
                className="font-body mb-2 block text-sm font-medium text-gray-800"
              >
                Custom Category
              </label>
              <input
                type="text"
                name="customCategory"
                id="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="font-body mt-1 block w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter custom category"
              />
            </div>
          )}
          <div>
            <label
              htmlFor="readTime"
              className="font-body mb-2 block text-sm font-medium text-gray-800"
            >
              Read Time (minutes)
            </label>
            <input
              type="number"
              name="readTime"
              id="readTime"
              value={post.readTime}
              onChange={handleChange}
              className="font-body mt-1 block w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 5"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="tags"
              className="font-body mb-2 block text-sm font-medium text-gray-800"
            >
              Tags (comma-separated)
            </label>
            <button
              type="button"
              onClick={handleAutoTags}
              disabled={isGeneratingTags}
              className="font-body flex items-center gap-1 text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 disabled:opacity-50"
            >
              {isGeneratingTags ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <span>✨</span> Suggest
                </>
              )}
            </button>
          </div>
          <input
            type="text"
            name="tags"
            id="tags"
            value={post.tags}
            onChange={handleChange}
            className="font-body mt-1 block w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Cover Image */}
        <div>
          <label
            htmlFor="mainImage"
            className="font-body mb-2 block text-sm font-medium text-gray-800"
          >
            Cover Image
          </label>
          <input
            type="file"
            name="mainImage"
            id="mainImage"
            onChange={handleImageChange}
            className="font-body mt-1 block w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 transition-colors file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-gray-700 hover:file:bg-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          {post.mainImage && !imageFile && (
            <img
              src={post.mainImage}
              alt="Current cover"
              className="mt-4 h-32 rounded-md border border-gray-200 object-cover shadow-sm"
            />
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="font-body flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
          </button>
        </div>

        {/* AI Assist Modal for Content */}
        <AIAssistModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onInsert={handleAIInsert}
          initialText={aiInitialText}
          defaultAction="outline"
          allowedActions={['outline', 'draft', 'improve', 'translate']}
        />

        {/* AI Assist Modal for Title */}
        <AIAssistModal
          isOpen={isTitleModalOpen}
          onClose={() => setIsTitleModalOpen(false)}
          onInsert={handleTitleInsert}
          initialText=""
          defaultAction="title"
          allowedActions={['title']}
        />
      </form>
    </>
  )
}
