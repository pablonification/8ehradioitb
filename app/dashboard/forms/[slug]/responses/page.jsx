"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FiDownload, FiEdit2 } from "react-icons/fi";

function stringifyAnswer(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(stringifyAnswer).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function FormResponsesPage() {
  const params = useParams();
  const eventSlug = params.slug;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ total: 0, items: [] });

  useEffect(() => {
    if (!eventSlug) return;
    void loadResponses();
  }, [eventSlug]);

  async function loadResponses() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${eventSlug}/submissions`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to fetch responses");
      }

      const payload = await response.json();
      setData({
        total: payload.total || 0,
        items: Array.isArray(payload.items) ? payload.items : [],
      });
    } catch (loadError) {
      setError(loadError.message || "Failed to fetch responses");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setError("");
    try {
      const response = await fetch(`/api/events/${eventSlug}/export/xlsx`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to export XLSX");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${eventSlug}-responses.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError.message || "Failed to export XLSX");
    }
  }

  const previewRows = useMemo(() => {
    return data.items.slice(0, 30);
  }, [data.items]);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl text-gray-900">
              Responses: {eventSlug}
            </h1>
            <p className="text-sm font-body text-gray-500 mt-1">
              Total response: <span className="font-semibold">{data.total}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/forms/${eventSlug}/builder`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-body"
            >
              <FiEdit2 /> Back to Builder
            </Link>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-body"
            >
              <FiDownload /> Export XLSX
            </button>
          </div>
        </div>
        {error ? <p className="text-sm text-red-600 font-body mt-3">{error}</p> : null}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-6 font-body text-gray-500">Loading responses...</div>
        ) : previewRows.length === 0 ? (
          <div className="p-6 font-body text-gray-500">Belum ada response.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-body font-semibold text-gray-700">Submitted At</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-gray-700">Submitter</th>
                <th className="text-left px-4 py-3 font-body font-semibold text-gray-700">Sample Answers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {previewRows.map((item) => {
                const answers =
                  item.answers && typeof item.answers === "object" && !Array.isArray(item.answers)
                    ? item.answers
                    : {};
                const answerPairs = Object.entries(answers)
                  .filter(([key]) => key !== "_system")
                  .slice(0, 3);

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-body text-gray-700 whitespace-nowrap">
                      {new Date(item.submittedAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-body text-gray-700 whitespace-nowrap">
                      {item.submitterUserId || "Anonymous"}
                    </td>
                    <td className="px-4 py-3 font-body text-gray-700">
                      {answerPairs.length === 0
                        ? "-"
                        : answerPairs
                            .map(([key, value]) => `${key}: ${stringifyAnswer(value)}`)
                            .join(" | ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
