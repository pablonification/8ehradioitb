"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FiPlus,
  FiExternalLink,
  FiEdit2,
  FiBarChart2,
  FiLink2,
  FiCopy,
  FiCheck,
  FiX,
} from "react-icons/fi";
import {
  normalizeShortLinkSlug,
  SHORTLINK_HOST,
  SHORTLINK_SLUG_ERROR_CODES,
  validateShortLinkSlug,
} from "@/lib/shortlinks/slug";

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100";
const SHORTLINK_DOMAIN = `https://${SHORTLINK_HOST}`;
const SHORTLINK_DISPLAY_DOMAIN = SHORTLINK_HOST;

function getShortLinkValidationMessage(errorCode) {
  switch (errorCode) {
    case SHORTLINK_SLUG_ERROR_CODES.REQUIRED:
      return "Slug wajib diisi.";
    case SHORTLINK_SLUG_ERROR_CODES.TOO_SHORT:
      return "Slug minimal 3 karakter.";
    case SHORTLINK_SLUG_ERROR_CODES.TOO_LONG:
      return "Slug maksimal 64 karakter.";
    case SHORTLINK_SLUG_ERROR_CODES.INVALID_FORMAT:
      return "Slug hanya boleh huruf kecil, angka, '-' dan '_'.";
    case SHORTLINK_SLUG_ERROR_CODES.RESERVED:
      return "Slug ini reserved, pakai slug lain.";
    default:
      return "Slug tidak valid.";
  }
}

function getFormSlugFromDestination(destination) {
  try {
    const parsed = new URL(destination);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length !== 2 || parts[0] !== "forms") {
      return "";
    }
    return decodeURIComponent(parts[1]);
  } catch {
    return "";
  }
}

export default function FormsDashboardPage() {
  const { status } = useSession();
  const [events, setEvents] = useState([]);
  const [shortLinks, setShortLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingShortLink, setIsSavingShortLink] = useState(false);
  const [isCopyingShortLink, setIsCopyingShortLink] = useState(false);
  const [error, setError] = useState("");
  const [shortLinkError, setShortLinkError] = useState("");
  const [shortLinkInfo, setShortLinkInfo] = useState("");
  const [origin, setOrigin] = useState("http://localhost:3000");
  const [shortLinkModal, setShortLinkModal] = useState({
    isOpen: false,
    event: null,
    slugInput: "",
  });
  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const formShortLinkMap = useMemo(() => {
    const map = new Map();
    for (const shortLink of shortLinks) {
      const eventSlug = getFormSlugFromDestination(shortLink.destination);
      if (eventSlug) {
        map.set(eventSlug, shortLink);
      }
    }
    return map;
  }, [shortLinks]);

  const selectedEvent = shortLinkModal.event;
  const selectedShortLink = selectedEvent
    ? formShortLinkMap.get(selectedEvent.slug) || null
    : null;

  const normalizedModalSlug = useMemo(
    () => normalizeShortLinkSlug(shortLinkModal.slugInput || ""),
    [shortLinkModal.slugInput],
  );
  const shortUrlPreview = normalizedModalSlug
    ? `${SHORTLINK_DOMAIN}/${normalizedModalSlug}`
    : `${SHORTLINK_DOMAIN}/...`;

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [events]);

  useEffect(() => {
    if (status === "authenticated") {
      void fetchEvents();
      void fetchShortLinks();
    }
  }, [status]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

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

  async function fetchShortLinks() {
    try {
      const response = await fetch("/api/shortlinks");
      if (!response.ok) {
        throw new Error("Failed to fetch short links");
      }
      const data = await response.json();
      setShortLinks(Array.isArray(data) ? data : []);
    } catch {
      setShortLinks([]);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!form.title.trim()) return;

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
          description: form.description.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to create form");
      }

      const created = await response.json();
      setEvents((prev) => [created, ...prev]);
      setForm({ title: "", description: "" });
    } catch (createError) {
      setError(createError.message || "Failed to create form");
    } finally {
      setIsCreating(false);
    }
  }

  function openShortLinkModal(item) {
    const existing = formShortLinkMap.get(item.slug);
    setShortLinkError("");
    setShortLinkInfo("");
    setIsCopyingShortLink(false);
    setShortLinkModal({
      isOpen: true,
      event: item,
      slugInput: existing?.slug || item.slug || "",
    });
  }

  function closeShortLinkModal() {
    setShortLinkModal({ isOpen: false, event: null, slugInput: "" });
    setShortLinkError("");
    setShortLinkInfo("");
    setIsCopyingShortLink(false);
  }

  async function handleSaveShortLink(event) {
    event.preventDefault();
    if (!selectedEvent) return;

    const finalSlug = normalizeShortLinkSlug(shortLinkModal.slugInput);
    const slugValidation = validateShortLinkSlug(finalSlug);
    if (!slugValidation.valid) {
      setShortLinkError(getShortLinkValidationMessage(slugValidation.code));
      return;
    }

    setIsSavingShortLink(true);
    setShortLinkError("");
    setShortLinkInfo("");

    try {
      const destination = `${origin}/forms/${selectedEvent.slug}`;
      const payload = {
        destination,
        title: `Form: ${selectedEvent.title}`,
        slug: finalSlug,
      };

      const response = await fetch("/api/shortlinks", {
        method: selectedShortLink ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          selectedShortLink
            ? {
                ...payload,
                id: selectedShortLink.id,
              }
            : payload,
        ),
      });

      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({}));
        throw new Error(payloadError?.error || "Gagal menyimpan short link.");
      }

      const saved = await response.json();
      setShortLinks((prev) => {
        if (selectedShortLink) {
          return prev.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...prev];
      });
      setShortLinkInfo("Short link berhasil disimpan.");
    } catch (saveError) {
      setShortLinkError(saveError.message || "Gagal menyimpan short link.");
    } finally {
      setIsSavingShortLink(false);
    }
  }

  async function handleCopyShortLink() {
    if (!normalizedModalSlug) return;

    try {
      await navigator.clipboard.writeText(`${SHORTLINK_DOMAIN}/${normalizedModalSlug}`);
      setIsCopyingShortLink(true);
      setTimeout(() => {
        setIsCopyingShortLink(false);
      }, 1500);
    } catch {
      setShortLinkError("Gagal copy ke clipboard.");
    }
  }

  return (
    <div className="space-y-8 text-slate-900">
      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="h-1.5 bg-[#f97316]" />
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">
                Form Builder
              </h1>
              <p className="mt-1 font-body text-slate-600">
                Buat form baru, atur versi, dan kelola response seperti Google Form.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <input
                type="text"
                value={form.title}
                onChange={(event) => {
                  const title = event.target.value;
                  setForm((prev) => ({ ...prev, title }));
                }}
                placeholder="Judul form"
                className={INPUT_CLASS}
                required
              />
            </div>

            <input
              type="text"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Deskripsi singkat"
              className={`md:col-span-1 ${INPUT_CLASS}`}
            />

            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ef4444] px-4 py-2 font-body font-semibold text-white transition hover:bg-[#dc2626] disabled:opacity-60"
            >
              <FiPlus /> {isCreating ? "Membuat..." : "Buat"}
            </button>
          </form>
        </div>
      </section>

      {error ? (
        <p className="font-body text-sm text-red-600">{error}</p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">Daftar Form</h2>
        </div>

        {isLoading ? (
          <div className="px-6 py-8 font-body text-slate-600">Loading forms...</div>
        ) : sortedEvents.length === 0 ? (
          <div className="px-6 py-8 font-body text-slate-600">
            Belum ada form. Buat yang pertama di atas.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedEvents.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div>
                  <p className="font-heading font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm font-body text-slate-500">/{item.slug}</p>
                  {formShortLinkMap.has(item.slug) ? (
                    <p className="text-sm font-body text-[#f97316]">
                      {SHORTLINK_DOMAIN}/{formShortLinkMap.get(item.slug).slug}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/forms/${item.slug}/builder`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-body text-slate-700 transition hover:bg-slate-50"
                  >
                    <FiEdit2 /> Builder
                  </Link>
                  <Link
                    href={`/dashboard/forms/${item.slug}/responses`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-body text-slate-700 transition hover:bg-slate-50"
                  >
                    <FiBarChart2 /> Responses
                  </Link>
                  <button
                    type="button"
                    onClick={() => openShortLinkModal(item)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-body text-slate-700 transition hover:bg-slate-50"
                  >
                    <FiLink2 /> Short Link
                  </button>
                  <Link
                    href={`/forms/${item.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-body text-white"
                  >
                    <FiExternalLink /> Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {shortLinkModal.isOpen && selectedEvent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeShortLinkModal();
            }
          }}
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-300 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-heading text-xl font-bold text-slate-900">
                  Short Link Form
                </h3>
                <p className="mt-1 text-sm font-body text-slate-600">
                  Atur short link `8eh.link` untuk form {selectedEvent.title}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeShortLinkModal}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveShortLink} className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-body font-medium text-slate-800">Customization</p>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="text"
                    value={SHORTLINK_DISPLAY_DOMAIN}
                    readOnly
                    className={`${INPUT_CLASS} w-52 bg-slate-50 text-slate-600 focus:border-slate-300 focus:ring-0`}
                  />
                  <span className="text-2xl font-body text-slate-500">/</span>
                  <input
                    type="text"
                    value={shortLinkModal.slugInput}
                    onChange={(event) =>
                      setShortLinkModal((prev) => ({
                        ...prev,
                        slugInput: event.target.value,
                      }))
                    }
                    placeholder="custom-back-half"
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <p className="mt-2 text-xs font-body text-slate-500">
                  Akan mengarah ke: {origin}/forms/{selectedEvent.slug}
                </p>
                <p className="mt-1 text-xs font-body text-slate-500">
                  Preview: {shortUrlPreview}
                </p>
              </div>

              {shortLinkError ? (
                <p className="text-sm font-body text-red-600">{shortLinkError}</p>
              ) : null}
              {shortLinkInfo ? (
                <p className="text-sm font-body text-emerald-700">{shortLinkInfo}</p>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopyShortLink}
                  disabled={!normalizedModalSlug}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-body text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {isCopyingShortLink ? <FiCheck /> : <FiCopy />}
                  {isCopyingShortLink ? "Copied" : "Copy"}
                </button>
                <button
                  type="submit"
                  disabled={isSavingShortLink}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#f97316] px-4 py-2 text-sm font-body font-semibold text-white transition hover:bg-[#ea580c] disabled:opacity-60"
                >
                  {isSavingShortLink ? "Saving..." : selectedShortLink ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
