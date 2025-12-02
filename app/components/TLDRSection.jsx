"use client";

import { useState } from "react";

export default function TLDRSection({ content, title }) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateSummary = async () => {
    if (summary) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/tldr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat ringkasan");
      }

      const data = await res.json();
      setSummary(data.summary);
      setIsExpanded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse bullet points from summary
  const parseBulletPoints = (text) => {
    if (!text) return [];
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[•\-\*]\s*/, ""))
      .map((line) => line.replace(/^\d+\.\s*/, "")); // Also remove numbered list prefix
  };

  // Render inline markdown (bold, italic, links)
  const renderMarkdown = (text) => {
    if (!text) return null;

    const parts = [];
    let remaining = text;
    let key = 0;

    // Process text for **bold**, *italic*, and [links](url)
    while (remaining.length > 0) {
      // Check for bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Check for italic *text* (not inside bold)
      const italicMatch = remaining.match(
        /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/,
      );
      // Check for links [text](url)
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

      // Find the earliest match
      const matches = [
        boldMatch && {
          type: "bold",
          match: boldMatch,
          index: remaining.indexOf(boldMatch[0]),
        },
        italicMatch && {
          type: "italic",
          match: italicMatch,
          index: remaining.indexOf(italicMatch[0]),
        },
        linkMatch && {
          type: "link",
          match: linkMatch,
          index: remaining.indexOf(linkMatch[0]),
        },
      ]
        .filter(Boolean)
        .sort((a, b) => a.index - b.index);

      if (matches.length === 0) {
        // No more matches, add remaining text
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      const first = matches[0];

      // Add text before the match
      if (first.index > 0) {
        parts.push(
          <span key={key++}>{remaining.substring(0, first.index)}</span>,
        );
      }

      // Add the formatted element
      if (first.type === "bold") {
        parts.push(
          <strong key={key++} className="font-semibold text-gray-900">
            {first.match[1]}
          </strong>,
        );
        remaining = remaining.substring(first.index + first.match[0].length);
      } else if (first.type === "italic") {
        parts.push(
          <em key={key++} className="italic">
            {first.match[1]}
          </em>,
        );
        remaining = remaining.substring(first.index + first.match[0].length);
      } else if (first.type === "link") {
        parts.push(
          <a
            key={key++}
            href={first.match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 hover:text-red-700 underline"
          >
            {first.match[1]}
          </a>,
        );
        remaining = remaining.substring(first.index + first.match[0].length);
      }
    }

    return parts;
  };

  const bulletPoints = parseBulletPoints(summary);

  return (
    <div className="mb-10">
      <div
        className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? "border-red-200 shadow-sm" : "border-gray-200 hover:border-red-200 hover:shadow-sm"}`}
      >
        {/* TL;DR Button/Header */}
        <button
          onClick={generateSummary}
          disabled={isLoading}
          className="w-full flex items-center justify-between bg-white px-6 py-5 cursor-pointer disabled:cursor-wait text-left"
        >
          <div className="flex items-center gap-4">
            {/* AI Sparkle Icon */}
            <div className="w-12 h-12 bg-[#D83232] rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="w-6 h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <span className="block font-heading font-bold text-gray-900 text-xl mb-0.5">
                TL;DR
              </span>
              <p className="text-sm text-gray-500 font-body">
                {summary
                  ? "Ringkasan artikel dengan AI"
                  : "Klik untuk membaca ringkasan instan"}
              </p>
            </div>
          </div>

          {/* Loading / Chevron */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-gray-100 shrink-0">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[#D83232] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            )}
          </div>
        </button>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-5">
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600 font-body flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Summary Content */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            isExpanded && summary
              ? "max-h-[800px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-6">
            <ul className="space-y-4">
              {bulletPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-[#D83232] rounded-full flex items-center justify-center text-xs font-bold mt-0.5 font-heading">
                    {index + 1}
                  </span>
                  <span className="font-body text-gray-700 leading-relaxed text-base">
                    {renderMarkdown(point)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 font-body pt-4 border-t border-gray-200/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm0 16a7 7 0 110-14 7 7 0 010 14zm0-10a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Dirangkum oleh AI. Baca artikel lengkap untuk detail lebih lanjut.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
