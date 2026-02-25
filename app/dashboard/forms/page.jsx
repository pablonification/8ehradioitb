"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FiPlus, FiExternalLink, FiEdit2, FiBarChart2 } from "react-icons/fi";

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function FormsDashboardPage() {
  const { status } = useSession();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
  });

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [events]);

  useEffect(() => {
    if (status === "authenticated") {
      void fetchEvents();
    }
  }, [status]);

  async function fetchEvents() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("Failed to fetch forms");
      }

      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to fetch forms");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to create form");
      }

      const created = await response.json();
      setEvents((prev) => [created, ...prev]);
      setForm({ title: "", slug: "", description: "" });
    } catch (createError) {
      setError(createError.message || "Failed to create form");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Form Builder
            </h1>
            <p className="font-body text-gray-600 mt-1">
              Buat form baru, atur versi, dan kelola response seperti Google Form.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug: prev.slug || slugify(title),
              }));
            }}
            placeholder="Judul form"
            className="px-3 py-2 rounded-lg border border-gray-300 font-body"
            required
          />
          <input
            type="text"
            value={form.slug}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))
            }
            placeholder="slug-form"
            className="px-3 py-2 rounded-lg border border-gray-300 font-body"
            required
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Deskripsi singkat"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 font-body"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-body font-semibold disabled:opacity-60"
            >
              <FiPlus /> {isCreating ? "Membuat..." : "Buat"}
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <p className="text-sm text-red-600 font-body">{error}</p>
      ) : null}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-heading font-bold text-lg text-gray-900">Daftar Form</h2>
        </div>

        {isLoading ? (
          <div className="px-6 py-8 font-body text-gray-500">Loading forms...</div>
        ) : sortedEvents.length === 0 ? (
          <div className="px-6 py-8 font-body text-gray-500">
            Belum ada form. Buat yang pertama di atas.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedEvents.map((item) => (
              <div key={item.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm font-body text-gray-500">/{item.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/forms/${item.slug}/builder`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-body"
                  >
                    <FiEdit2 /> Builder
                  </Link>
                  <Link
                    href={`/dashboard/forms/${item.slug}/responses`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-body"
                  >
                    <FiBarChart2 /> Responses
                  </Link>
                  <Link
                    href={`/forms/${item.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-body"
                  >
                    <FiExternalLink /> Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
