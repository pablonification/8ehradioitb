"use client";

import { useState, useRef, useEffect } from "react";

const ACTIONS = [
  {
    id: "title",
    label: "Generate Title",
    icon: "💡",
    placeholder: "Masukkan topik atau deskripsi singkat artikel...",
    description: "Buat judul artikel yang menarik dan SEO-friendly",
  },
  {
    id: "outline",
    label: "Generate Outline",
    icon: "📝",
    placeholder: "Masukkan topik atau judul artikel...",
    description: "Buat outline artikel dari topik",
  },
  {
    id: "draft",
    label: "Generate Draft",
    icon: "📄",
    placeholder: "Masukkan topik, outline, atau deskripsi artikel...",
    description: "Buat draft artikel lengkap",
  },
  {
    id: "improve",
    label: "Improve Text",
    icon: "✨",
    placeholder: "Paste teks yang ingin diperbaiki...",
    description: "Perbaiki dan tingkatkan kualitas teks",
  },
  {
    id: "translate",
    label: "Translate",
    icon: "🌐",
    placeholder: "Paste teks untuk diterjemahkan (ID↔EN)...",
    description: "Terjemahkan Indonesia ↔ Inggris",
  },
];

export default function AIAssistModal({
  isOpen,
  onClose,
  onInsert,
  initialText = "",
  defaultAction = "outline",
  allowedActions = null, // null means all actions, or pass array like ["title"] or ["outline", "draft", "improve", "translate"]
}) {
  // Filter actions based on allowedActions prop
  const availableActions = allowedActions
    ? ACTIONS.filter((a) => allowedActions.includes(a.id))
    : ACTIONS;

  const [selectedAction, setSelectedAction] = useState(defaultAction);
  const [input, setInput] = useState(initialText);
  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const outputRef = useRef(null);

  // Auto-scroll output as it streams
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [completion]);

  // Reset state when modal opens with new defaultAction
  useEffect(() => {
    if (isOpen) {
      setSelectedAction(defaultAction);
      setInput(initialText);
      setCompletion("");
      setError(null);
    }
  }, [isOpen, defaultAction, initialText]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleGenerate = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setCompletion("");

    try {
      const response = await fetch("/api/ai/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: input,
          action: selectedAction,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate");
      }

      // Handle streaming response (plain text stream)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        result += chunk;
        setCompletion(result);
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (completion) {
      onInsert(completion);
      onClose();
    }
  };

  const handleCopy = () => {
    if (completion) {
      navigator.clipboard.writeText(completion);
    }
  };

  if (!isOpen) return null;

  const currentAction = ACTIONS.find((a) => a.id === selectedAction);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <h2 className="text-xl font-heading font-bold text-gray-800">
              AI Writing Assistant
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
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
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <button
                type="button"
                key={action.id}
                onClick={() => setSelectedAction(action.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedAction === action.id
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {currentAction?.description}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentAction?.placeholder}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-xl font-body text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!input.trim() || isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error.message || "Terjadi kesalahan. Coba lagi ya!"}
            </div>
          )}

          {/* Output */}
          {completion && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output
              </label>
              <div
                ref={outputRef}
                className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 font-mono text-sm text-gray-800 max-h-64 overflow-y-auto whitespace-pre-wrap"
              >
                {completion}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {completion && (
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 bg-gray-50">
            <button
              type="button"
              onClick={handleInsert}
              className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Insert into Editor
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="py-2 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
