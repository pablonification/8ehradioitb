"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CHAT_INITIAL_MESSAGE, QUICK_REPLIES } from "@/lib/chatKnowledge";
import Image from "next/image";
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [messages, setMessages] = useState([CHAT_INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Show notification dot when assistant sends a message while closed
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        setHasNewMessage(true);
      }
    }
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();

      if (!input.trim() || isLoading) return;

      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        // Handle streaming response (plain text stream)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
        };

        setMessages((prev) => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantContent += chunk;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: assistantContent,
            };
            return newMessages;
          });
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Maaf, ada kesalahan. Coba lagi ya!",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages],
  );

  const handleQuickReply = (message) => {
    setInput(message);
    setTimeout(() => {
      const form = document.getElementById("chat-form");
      if (form) form.requestSubmit();
    }, 100);
  };

  const formatMessage = (content) => {
    // Simple markdown parser for chat messages
    const parseInlineMarkdown = (text) => {
      const parts = [];
      let remaining = text;
      let key = 0;

      while (remaining.length > 0) {
        // Bold **text** or __text__
        const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
        if (boldMatch) {
          parts.push(
            <strong key={key++} className="font-semibold">
              {boldMatch[2]}
            </strong>,
          );
          remaining = remaining.slice(boldMatch[0].length);
          continue;
        }

        // Italic *text* or _text_
        const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
        if (italicMatch) {
          parts.push(<em key={key++}>{italicMatch[2]}</em>);
          remaining = remaining.slice(italicMatch[0].length);
          continue;
        }

        // Links [text](url)
        const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
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
            </a>,
          );
          remaining = remaining.slice(linkMatch[0].length);
          continue;
        }

        // Regular text - take one character at a time until we hit markdown
        const nextSpecial = remaining.search(/[\*_\[]/);
        if (nextSpecial === -1) {
          parts.push(remaining);
          break;
        } else if (nextSpecial === 0) {
          // If we're at a special char but didn't match, treat as regular text
          parts.push(remaining[0]);
          remaining = remaining.slice(1);
        } else {
          parts.push(remaining.slice(0, nextSpecial));
          remaining = remaining.slice(nextSpecial);
        }
      }

      return parts;
    };

    // Split by lines and handle lists
    const lines = content.split("\n");
    const elements = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Bullet list
      if (line.match(/^[\-\*]\s/)) {
        elements.push(
          <div key={i} className="flex gap-2 ml-2">
            <span>•</span>
            <span>{parseInlineMarkdown(line.slice(2))}</span>
          </div>,
        );
      }
      // Numbered list
      else if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\./)[1];
        elements.push(
          <div key={i} className="flex gap-2 ml-2">
            <span>{num}.</span>
            <span>{parseInlineMarkdown(line.slice(num.length + 2))}</span>
          </div>,
        );
      }
      // Regular line
      else {
        elements.push(
          <span key={i}>
            {parseInlineMarkdown(line)}
            {i < lines.length - 1 && <br />}
          </span>,
        );
      }
    }

    return elements;
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open chat"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {/* Notification dot */}
        {hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isOpen
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0 pointer-events-none"
        }`}
        style={{ transformOrigin: "bottom right" }}
      >
        {/* Header */}
        <div className="bg-orange-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Image
                src="/8eh-real.svg"
                alt="8EH Radio ITB"
                width={40}
                height={40}
              />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">
                8EH Assistant
              </h3>
              <p className="text-white/80 text-xs">
                Siap membantu Kampus Mania!
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <svg
              className="w-5 h-5 text-white"
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  message.role === "user"
                    ? "bg-orange-500 text-white rounded-br-md"
                    : "bg-white text-gray-800 shadow-sm rounded-bl-md border border-gray-100"
                }`}
              >
                {formatMessage(message.content)}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                <div className="flex space-x-1">
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies - Show only for initial state */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 border-t border-gray-100 bg-white">
            <p className="text-xs text-gray-500 mb-2">Pertanyaan populer:</p>
            <div className="flex flex-wrap gap-1">
              {QUICK_REPLIES.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply.message)}
                  disabled={isLoading}
                  className="px-3 py-1 text-xs bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 transition-colors disabled:opacity-50"
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
          className="p-3 border-t border-gray-200 bg-white"
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ketik pesan..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
  );
}
