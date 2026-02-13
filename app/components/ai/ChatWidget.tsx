'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChangeEvent, FormEvent, ReactElement } from 'react'
import { CHAT_INITIAL_MESSAGE, QUICK_REPLIES } from '@/lib/chatKnowledge'
import Image from 'next/image'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id?: string
  role: ChatRole
  content: string
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([CHAT_INITIAL_MESSAGE as ChatMessage])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Show notification dot when assistant sends a message while closed
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant') {
        setHasNewMessage(true)
      }
    }
  }, [messages, isOpen])

  const handleOpen = () => {
    setIsOpen(true)
    setHasNewMessage(false)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = useCallback(
    async (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault()

      if (!input.trim() || isLoading) return

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input.trim(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setIsLoading(true)

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get response')
        }

        // Handle streaming response (plain text stream)
        if (!response.body) {
          throw new Error('Empty response body')
        }
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let assistantContent = ''

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
        }

        setMessages((prev) => [...prev, assistantMessage])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantContent += chunk
          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: assistantContent,
            }
            return newMessages
          })
        }
      } catch (error) {
        console.error('Chat error:', error)
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Maaf, ada kesalahan. Coba lagi ya!',
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, messages]
  )

  const handleQuickReply = (message: string) => {
    setInput(message)
    setTimeout(() => {
      const form = document.getElementById('chat-form')
      if (form instanceof HTMLFormElement) form.requestSubmit()
    }, 100)
  }

  const formatMessage = (content: string) => {
    // Simple markdown parser for chat messages
    const parseInlineMarkdown = (text: string) => {
      const parts: Array<string | ReactElement> = []
      let remaining = text
      let key = 0

      while (remaining.length > 0) {
        // Bold **text** or __text__
        const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/)
        if (boldMatch) {
          parts.push(
            <strong key={key++} className="font-semibold">
              {boldMatch[2]}
            </strong>
          )
          remaining = remaining.slice(boldMatch[0].length)
          continue
        }

        // Italic *text* or _text_
        const italicMatch = remaining.match(/^(\*|_)(.+?)\1/)
        if (italicMatch) {
          parts.push(<em key={key++}>{italicMatch[2]}</em>)
          remaining = remaining.slice(italicMatch[0].length)
          continue
        }

        // Links [text](url)
        const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
        if (linkMatch) {
          parts.push(
            <a
              key={key++}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              {linkMatch[1]}
            </a>
          )
          remaining = remaining.slice(linkMatch[0].length)
          continue
        }

        // Regular text - take one character at a time until we hit markdown
        const nextSpecial = remaining.search(/[\*_\[]/)
        if (nextSpecial === -1) {
          parts.push(remaining)
          break
        } else if (nextSpecial === 0) {
          // If we're at a special char but didn't match, treat as regular text
          parts.push(remaining[0])
          remaining = remaining.slice(1)
        } else {
          parts.push(remaining.slice(0, nextSpecial))
          remaining = remaining.slice(nextSpecial)
        }
      }

      return parts
    }

    // Split by lines and handle lists
    const lines = content.split('\n')
    const elements: ReactElement[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Bullet list
      if (line.match(/^[\-\*]\s/)) {
        elements.push(
          <div key={i} className="ml-2 flex gap-2">
            <span>•</span>
            <span>{parseInlineMarkdown(line.slice(2))}</span>
          </div>
        )
      }
      // Numbered list
      else if (line.match(/^\d+\.\s/)) {
        const numberMatch = line.match(/^(\d+)\./)
        if (!numberMatch) continue
        const num = numberMatch[1]
        elements.push(
          <div key={i} className="ml-2 flex gap-2">
            <span>{num}.</span>
            <span>{parseInlineMarkdown(line.slice(num.length + 2))}</span>
          </div>
        )
      }
      // Regular line
      else {
        elements.push(
          <span key={i}>
            {parseInlineMarkdown(line)}
            {i < lines.length - 1 && <br />}
          </span>
        )
      }
    }

    return elements
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={handleOpen}
        className={`fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-all duration-300 hover:bg-orange-600 hover:shadow-xl ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="Open chat"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {/* Notification dot */}
        {hasNewMessage && (
          <span className="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full bg-green-500" />
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed right-6 bottom-6 z-50 flex h-[500px] max-h-[calc(100vh-100px)] w-[360px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-0 opacity-0'
        }`}
        style={{ transformOrigin: 'bottom right' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-orange-500 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Image src="/8eh-real.svg" alt="8EH Radio ITB" width={40} height={40} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">8EH Assistant</h3>
              <p className="text-xs text-white/80">Siap membantu Kampus Mania!</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 transition-colors hover:bg-white/20"
            aria-label="Close chat"
          >
            <svg
              className="h-5 w-5 text-white"
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

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-orange-500 text-white'
                    : 'rounded-bl-md border border-gray-100 bg-white text-gray-800 shadow-sm'
                }`}
              >
                {formatMessage(message.content)}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-2 shadow-sm">
                <div className="flex space-x-1">
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies - Show only for initial state */}
        {messages.length <= 1 && (
          <div className="border-t border-gray-100 bg-white px-4 py-2">
            <p className="mb-2 text-xs text-gray-500">Pertanyaan populer:</p>
            <div className="flex flex-wrap gap-1">
              {QUICK_REPLIES.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply.message)}
                  disabled={isLoading}
                  className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
                >
                  {reply.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          id="chat-form"
          onSubmit={handleSubmit}
          className="border-t border-gray-200 bg-white p-3"
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ketik pesan..."
              disabled={isLoading}
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
