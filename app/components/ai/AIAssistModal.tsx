'use client'

import { useState, useRef, useEffect, type ChangeEvent } from 'react'

const ACTIONS = [
  {
    id: 'title',
    label: 'Generate Title',
    icon: '💡',
    placeholder: 'Masukkan topik atau deskripsi singkat artikel...',
    description: 'Buat judul artikel yang menarik dan SEO-friendly',
  },
  {
    id: 'outline',
    label: 'Generate Outline',
    icon: '📝',
    placeholder: 'Masukkan topik atau judul artikel...',
    description: 'Buat outline artikel dari topik',
  },
  {
    id: 'draft',
    label: 'Generate Draft',
    icon: '📄',
    placeholder: 'Masukkan topik, outline, atau deskripsi artikel...',
    description: 'Buat draft artikel lengkap',
  },
  {
    id: 'improve',
    label: 'Improve Text',
    icon: '✨',
    placeholder: 'Paste teks yang ingin diperbaiki...',
    description: 'Perbaiki dan tingkatkan kualitas teks',
  },
  {
    id: 'translate',
    label: 'Translate',
    icon: '🌐',
    placeholder: 'Paste teks untuk diterjemahkan (ID↔EN)...',
    description: 'Terjemahkan Indonesia ↔ Inggris',
  },
] as const

export default function AIAssistModal({
  isOpen,
  onClose,
  onInsert,
  initialText = '',
  defaultAction = 'outline',
  allowedActions = null, // null means all actions, or pass array like ["title"] or ["outline", "draft", "improve", "translate"]
}: {
  isOpen: boolean
  onClose: () => void
  onInsert: (text: string) => void
  initialText?: string
  defaultAction?: 'title' | 'outline' | 'draft' | 'improve' | 'translate'
  allowedActions?: Array<'title' | 'outline' | 'draft' | 'improve' | 'translate'> | null
}) {
  // Filter actions based on allowedActions prop
  const availableActions = allowedActions
    ? ACTIONS.filter((a) => allowedActions.includes(a.id))
    : ACTIONS

  const [selectedAction, setSelectedAction] = useState(defaultAction)
  const [input, setInput] = useState(initialText)
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const outputRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll output as it streams
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [completion])

  // Reset state when modal opens with new defaultAction
  useEffect(() => {
    if (isOpen) {
      setSelectedAction(defaultAction)
      setInput(initialText)
      setCompletion('')
      setError(null)
    }
  }, [isOpen, defaultAction, initialText])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleGenerate = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setCompletion('')

    try {
      const response = await fetch('/api/ai/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input,
          action: selectedAction,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate')
      }

      // Handle streaming response (plain text stream)
      if (!response.body) {
        throw new Error('Empty response body')
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let result = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        result += chunk
        setCompletion(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInsert = () => {
    if (completion) {
      onInsert(completion)
      onClose()
    }
  }

  const handleCopy = () => {
    if (completion) {
      navigator.clipboard.writeText(completion)
    }
  }

  if (!isOpen) return null

  const currentAction = ACTIONS.find((a) => a.id === selectedAction)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <h2 className="font-heading text-xl font-bold text-gray-800">AI Writing Assistant</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <svg
              className="h-5 w-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <button
                type="button"
                key={action.id}
                onClick={() => setSelectedAction(action.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedAction === action.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">{currentAction?.description}</p>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Input</label>
            <textarea
              value={input}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              placeholder={currentAction?.placeholder}
              rows={4}
              className="font-body w-full resize-none rounded-xl border border-gray-300 bg-white p-3 text-gray-900 transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!input.trim() || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-4 py-3 font-semibold text-white transition-all hover:from-orange-600 hover:to-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <span>✨</span>
                Generate
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error.message || 'Terjadi kesalahan. Coba lagi ya!'}
            </div>
          )}

          {/* Output */}
          {completion && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Output</label>
              <div
                ref={outputRef}
                className="max-h-64 w-full overflow-y-auto rounded-xl border border-gray-300 bg-gray-50 p-4 font-mono text-sm whitespace-pre-wrap text-gray-800"
              >
                {completion}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {completion && (
          <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={handleInsert}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Insert into Editor
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-100"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
