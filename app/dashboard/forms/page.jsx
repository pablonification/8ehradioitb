"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiExternalLink,
  FiEdit2,
  FiBarChart2,
  FiLink2,
  FiCopy,
  FiCheck,
  FiX,
  FiMoreVertical,
  FiTrash2,
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
      return "Slug hanya boleh huruf, angka, '-' dan '_'.";
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

function formatLastOpened(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d
      .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      .replace(":", ".");
  }
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const FormDocIcon = () => (
  <svg
    className="h-6 w-6 text-[#f97316]"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  </svg>
);

function FormsListSkeleton() {
  return (
    <div className="mt-2 space-y-6">
      {["Hari ini", "7 hari sebelumnya"].map((group) => (
        <div key={group} className="animate-pulse">
          <div className="mb-2 h-4 w-36 rounded bg-slate-200" />
          <div className="space-y-2">
            {[1, 2, 3].map((row) => (
              <div
                key={`${group}-${row}`}
                className="flex items-center justify-between gap-4 rounded-lg border-b border-slate-100 px-2 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="h-6 w-6 rounded bg-slate-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-56 rounded bg-slate-200" />
                    <div className="h-3 w-28 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="hidden w-52 flex-shrink-0 items-center justify-between md:flex">
                  <div className="h-3 w-12 rounded bg-slate-200" />
                  <div className="h-3 w-20 rounded bg-slate-200" />
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FormsDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
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
  const [openMenuId, setOpenMenuId] = useState(null);
  const [shortLinkModal, setShortLinkModal] = useState({
    isOpen: false,
    event: null,
    slugInput: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, event: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingShortLink, setIsDeletingShortLink] = useState(false);

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
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [events]);

  const groupedEvents = useMemo(() => {
    const groups = {
      "Hari ini": [],
      "7 hari sebelumnya": [],
      "30 hari sebelumnya": [],
      Sebelumnya: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const event of sortedEvents) {
      const updated = new Date(event.updatedAt);
      const updatedDate = new Date(
        updated.getFullYear(),
        updated.getMonth(),
        updated.getDate(),
      );

      if (updatedDate.getTime() === today.getTime()) {
        groups["Hari ini"].push(event);
      } else if (updatedDate >= sevenDaysAgo) {
        groups["7 hari sebelumnya"].push(event);
      } else if (updatedDate >= thirtyDaysAgo) {
        groups["30 hari sebelumnya"].push(event);
      } else {
        groups.Sebelumnya.push(event);
      }
    }

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [sortedEvents]);

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

    function handleOutsideClick() {
      setOpenMenuId(null);
    }

    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
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

  async function handleCreateBlankForm() {
    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Formulir Tanpa Judul",
          description: "",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Gagal membuat formulir");
      }

      const created = await response.json();
      setEvents((prev) => [created, ...prev]);
      router.push(`/dashboard/forms/${created.slug}/builder`);
    } catch (createError) {
      setError(createError.message || "Gagal membuat formulir");
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
      await navigator.clipboard.writeText(
        `${SHORTLINK_DOMAIN}/${normalizedModalSlug}`,
      );
      setIsCopyingShortLink(true);
      setTimeout(() => {
        setIsCopyingShortLink(false);
      }, 1500);
    } catch {
      setShortLinkError("Gagal copy ke clipboard.");
    }
  }

  async function handleDeleteForm() {
    if (!deleteConfirm.event) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/events/${deleteConfirm.event.slug}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Gagal menghapus form.");
      }
      setEvents((prev) => prev.filter((e) => e.id !== deleteConfirm.event.id));
      // Remove associated shortlink from local state too.
      const linked = formShortLinkMap.get(deleteConfirm.event.slug);
      if (linked) {
        setShortLinks((prev) => prev.filter((sl) => sl.id !== linked.id));
      }
      setDeleteConfirm({ isOpen: false, event: null });
    } catch (err) {
      setError(err.message || "Gagal menghapus form.");
      setDeleteConfirm({ isOpen: false, event: null });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteShortLink() {
    if (!selectedShortLink) return;
    setIsDeletingShortLink(true);
    setShortLinkError("");
    try {
      const res = await fetch(`/api/shortlinks/${selectedShortLink.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Gagal menghapus short link.");
      }
      setShortLinks((prev) => prev.filter((sl) => sl.id !== selectedShortLink.id));
      closeShortLinkModal();
    } catch (err) {
      setShortLinkError(err.message || "Gagal menghapus short link.");
    } finally {
      setIsDeletingShortLink(false);
    }
  }

  return (
    <div className="-mx-4 -mt-4 flex min-h-safe-screen flex-col text-slate-800 sm:-mx-6 sm:-mt-6 md:-mx-8 md:-mt-8">
      <div className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6 md:px-8">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={handleCreateBlankForm}
            disabled={isCreating}
            className="group relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-10 transition-all hover:border-[#f97316] hover:bg-orange-50/50 focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#f97316]" />
                <div className="mt-1 text-center">
                  <span className="block font-heading text-base font-semibold text-slate-700">
                    Sedang Membuat...
                  </span>
                  <span className="mt-1 block font-body text-sm text-slate-500">
                    Mohon tunggu sebentar
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-[#f97316] transition-colors duration-200 group-hover:bg-[#f97316] group-hover:text-white group-hover:shadow-md">
                  <FiPlus size={28} />
                </div>
                <div className="mt-1 text-center">
                  <span className="block font-heading text-base font-semibold text-slate-900 transition-colors group-hover:text-[#f97316]">
                    Buat Formulir Baru
                  </span>
                  <span className="mt-1 block font-body text-sm text-slate-500">
                    Mulai formulir kosong dari awal
                  </span>
                </div>
              </>
            )}
          </button>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-center font-body text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex-1 bg-white px-4 py-6 sm:px-6 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-body text-base font-medium text-slate-800">
              Formulir terbaru
            </h2>
          </div>

          <div className="flex flex-col">
            {isLoading || status === "loading" ? (
              <FormsListSkeleton />
            ) : sortedEvents.length === 0 ? (
              <div className="py-8 text-center font-body text-slate-600">
                Belum ada form. Klik tombol di atas untuk mulai.
              </div>
            ) : (
              <div className="mt-2 space-y-6">
                {groupedEvents.map(([groupName, items]) => (
                  <div key={groupName}>
                    <h3 className="mb-2 font-body text-sm font-medium text-slate-800">
                      {groupName}
                    </h3>
                    <div className="flex flex-col">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="group relative -mx-2 flex cursor-pointer items-center justify-between gap-4 rounded-lg border-b border-slate-100 px-2 py-3 transition hover:bg-slate-50"
                          onClick={() =>
                            router.push(`/dashboard/forms/${item.slug}/builder`)
                          }
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-4">
                            <FormDocIcon />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-body text-base font-medium text-slate-800 group-hover:text-slate-900">
                                {item.title}
                              </p>
                              {formShortLinkMap.has(item.slug) ? (
                                <span className="mt-1 inline-block rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-800">
                                  {formShortLinkMap.get(item.slug).slug}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="mr-12 hidden w-64 flex-shrink-0 items-center justify-between font-body text-sm text-slate-600 md:flex">
                            <span>saya</span>
                            <span>{formatLastOpened(item.updatedAt)}</span>
                          </div>

                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenMenuId(
                                  openMenuId === item.id ? null : item.id,
                                );
                              }}
                              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200 focus:outline-none"
                            >
                              <FiMoreVertical size={20} />
                            </button>

                            {openMenuId === item.id ? (
                              <div
                                className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-slate-100 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <Link
                                  href={`/dashboard/forms/${item.slug}/builder`}
                                  onClick={() => setOpenMenuId(null)}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                  <FiEdit2 size={16} /> Builder
                                </Link>
                                <Link
                                  href={`/dashboard/forms/${item.slug}/builder?tab=responses`}
                                  onClick={() => setOpenMenuId(null)}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                  <FiBarChart2 size={16} /> Responses
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    openShortLinkModal(item);
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                >
                                  <FiLink2 size={16} /> Short Link
                                </button>
                                <Link
                                  href={`/forms/${item.slug}`}
                                  target="_blank"
                                  onClick={() => setOpenMenuId(null)}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                  <FiExternalLink size={16} /> Buka (Tab Baru)
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setDeleteConfirm({ isOpen: true, event: item });
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <FiTrash2 size={16} /> Hapus
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {shortLinkModal.isOpen && selectedEvent ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
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
                <p className="text-sm font-body font-medium text-slate-800">
                  Customization
                </p>
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
                <p className="text-sm font-body text-red-600">
                  {shortLinkError}
                </p>
              ) : null}
              {shortLinkInfo ? (
                <p className="text-sm font-body text-emerald-700">
                  {shortLinkInfo}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2">
                {selectedShortLink ? (
                  <button
                    type="button"
                    onClick={handleDeleteShortLink}
                    disabled={isDeletingShortLink}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-body text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <FiTrash2 size={14} />
                    {isDeletingShortLink ? "Menghapus..." : "Hapus Short Link"}
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex flex-wrap items-center gap-2">
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
                    {isSavingShortLink
                      ? "Saving..."
                      : selectedShortLink
                        ? "Update"
                        : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {deleteConfirm.isOpen && deleteConfirm.event ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteConfirm({ isOpen: false, event: null });
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-heading text-lg font-bold text-slate-900">
              Hapus formulir?
            </h3>
            <p className="mt-2 text-sm font-body text-slate-600">
              <span className="font-semibold">{deleteConfirm.event.title}</span>{" "}
              beserta semua respons dan versi akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
            </p>
            {formShortLinkMap.has(deleteConfirm.event.slug) ? (
              <p className="mt-2 text-sm font-body text-amber-700">
                Short link{" "}
                <span className="font-semibold">
                  {formShortLinkMap.get(deleteConfirm.event.slug).slug}
                </span>{" "}
                yang terhubung juga akan ikut terhapus.
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, event: null })}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-body text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteForm}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-body font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
