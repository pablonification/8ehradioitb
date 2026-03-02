"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { hasAnyRole } from "@/lib/roleUtils";
import {
  extractFileKeysFromValue,
  normalizeBiodata,
  stringifyProfileValue,
} from "@/lib/profile/database";

const ROLE_OPTIONS = ["DEVELOPER", "DATA", "TECHNIC", "REPORTER", "KRU", "MUSIC"];
// ── Icons ──────────────────────────────────────────────────────────────────────
function IconEdit({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function IconX({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
const COMPLETENESS_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "complete", label: "Lengkap (field wajib)" },
  { value: "incomplete", label: "Belum lengkap" },
];

function inputClassName() {
  return "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-body text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors";
}

function renderCell(value) {
  const text = stringifyProfileValue(value);
  return text || "-";
}

function KruDatabasePageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="h-1.5 bg-[#f97316]" />
        <div className="space-y-4 p-6">
          <div className="h-8 w-56 rounded bg-slate-200" />
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-11 rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="p-6 space-y-3">
          <div className="h-4 w-36 rounded bg-slate-200" />
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-12 rounded-lg bg-slate-100" />
          ))}
        </div>
      </section>
    </div>
  );
}

function KruDatabaseTableSkeleton() {
  return (
    <div className="p-6 space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="h-11 rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export default function KruDatabasePage() {
  const { data: session, status } = useSession();
  const hasAccess = hasAnyRole(session?.user?.role, ["DATA", "DEVELOPER"]);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [completeness, setCompleteness] = useState("all");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [items, setItems] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({ total: 0, filteredTotal: 0, limit: 500, hasMore: false });
  const [downloadingKey, setDownloadingKey] = useState("");
  const [editingProfile, setEditingProfile] = useState(null);
  const [editingBiodata, setEditingBiodata] = useState({});
  const [editingName, setEditingName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [claimRequests, setClaimRequests] = useState([]);
  const [claimRequestsLoading, setClaimRequestsLoading] = useState(true);
  const [claimActionId, setClaimActionId] = useState("");
  const [claimError, setClaimError] = useState("");

  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (status === "authenticated" && hasAccess) {
      void Promise.all([loadProfiles(), loadClaimRequests()]);
    }
  }, [status, hasAccess]);

  function currentFilters() {
    return {
      query,
      roleFilter,
      completeness,
      fieldKey,
      fieldValue,
    };
  }

  function buildSearchParams(filters, withLimit = true) {
    const params = new URLSearchParams();
    if (filters.query.trim()) params.set("q", filters.query.trim());
    if (filters.roleFilter) params.set("role", filters.roleFilter);
    if (filters.completeness !== "all") params.set("completeness", filters.completeness);
    if (filters.fieldKey) params.set("fieldKey", filters.fieldKey);
    if (filters.fieldValue.trim()) params.set("fieldValue", filters.fieldValue.trim());
    if (withLimit) params.set("limit", "500");
    return params;
  }

  async function loadProfiles(nextFilters = null) {
    setLoading(true);
    setError("");

    try {
      const params = buildSearchParams(nextFilters || currentFilters(), true);
      const response = await fetch(`/api/profile/database?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch kru database");
      }
      const payload = await response.json();
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setFields(Array.isArray(payload.fields) ? payload.fields : []);
      setMeta({
        total: Number(payload.total || 0),
        filteredTotal: Number(payload.filteredTotal || 0),
        limit: Number(payload.limit || 500),
        hasMore: Boolean(payload.hasMore),
      });
    } catch (loadError) {
      setError(loadError.message || "Failed to fetch kru database");
    } finally {
      setLoading(false);
    }
  }

  async function loadClaimRequests() {
    setClaimRequestsLoading(true);
    setClaimError("");
    try {
      const response = await fetch("/api/profile/claim-requests?status=PENDING&limit=100");
      if (!response.ok) {
        throw new Error("Failed to fetch claim requests");
      }
      const payload = await response.json().catch(() => ({}));
      setClaimRequests(Array.isArray(payload.items) ? payload.items : []);
    } catch (errorLoadClaim) {
      setClaimError(errorLoadClaim.message || "Failed to fetch claim requests");
    } finally {
      setClaimRequestsLoading(false);
    }
  }

  async function handleClaimDecision(id, action) {
    setClaimActionId(id);
    setClaimError("");
    try {
      const response = await fetch("/api/profile/claim-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Gagal memproses claim request");
      }
      setClaimRequests((prev) => prev.filter((item) => item.id !== id));
      if (action === "approve") {
        await loadProfiles();
      }
    } catch (claimActionError) {
      setClaimError(claimActionError.message || "Gagal memproses claim request");
    } finally {
      setClaimActionId("");
    }
  }

  const exportHref = useMemo(() => {
    const params = buildSearchParams(currentFilters(), false).toString();
    return `/api/profile/database/export${params ? `?${params}` : ""}`;
  }, [query, roleFilter, completeness, fieldKey, fieldValue]);

  const activeField = useMemo(
    () => fields.find((field) => field.key === fieldKey) || null,
    [fields, fieldKey],
  );

  const dynamicColumns = useMemo(() => fields, [fields]);

  async function handleDownloadFile(fileKey) {
    if (!fileKey) return;
    setDownloadingKey(fileKey);
    setError("");

    try {
      const response = await fetch("/api/files/download-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: fileKey }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Gagal membuat download link");
      }

      const payload = await response.json();
      if (!payload.downloadUrl) {
        throw new Error("Download URL tidak tersedia");
      }

      window.open(payload.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(downloadError.message || "Gagal mengunduh file");
    } finally {
      setDownloadingKey("");
    }
  }
  async function handleDeleteProfile(id, name) {
    if (!confirm(`Apakah Anda yakin ingin menghapus data profil untuk "${name}"?`)) return;
    setDeletingId(id);
    setError("");
    try {
      const response = await fetch(`/api/profile/database?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Gagal menghapus profil");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      setMeta((prev) => ({ ...prev, total: prev.total - 1, filteredTotal: prev.filteredTotal - 1 }));
    } catch (err) {
      setError(err.message || "Gagal menghapus profil");
    } finally {
      setDeletingId("");
    }
  }

  function startEditProfile(profile) {
    setEditingProfile(profile);
    const biodata = normalizeBiodata(profile.biodata);
    setEditingBiodata({ ...biodata });
    setEditingName(biodata.fullName || profile.displayName || profile.user?.name || "");
    setEditError("");
  }

  function cancelEdit() {
    setEditingProfile(null);
    setEditingBiodata({});
    setEditingName("");
    setEditError("");
  }

  async function uploadFile(fieldKey, file, targetUserId) {
    const response = await fetch("/api/profile/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fieldKey,
        targetUserId,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Failed to prepare upload");
    }

    const { uploadUrl, key } = await response.json();

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file");
    }

    return key;
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    setEditError("");

    try {
      const response = await fetch("/api/profile/database", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProfile.id,
          displayName: editingName,
          biodata: editingBiodata,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Gagal memperbarui profil");
      }

      const payload = await response.json();
      setItems((prev) =>
        prev.map((item) => (item.id === payload.updated.id ? payload.updated : item)),
      );
      cancelEdit();
    } catch (err) {
      setEditError(err.message || "Gagal memperbarui profil");
    } finally {
      setSavingEdit(false);
    }
  }

  if (status === "loading") {
    return <KruDatabasePageSkeleton />;
  }

  if (!hasAccess) {
    return (
      <div className="font-body text-red-600">
        Akses ditolak. Halaman ini hanya untuk DATA/DEVELOPER.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 text-slate-900">
      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="h-1.5 bg-[#f97316]" />
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-900">
                Claim Request (Pending)
              </h2>
              <p className="mt-1 font-body text-sm text-slate-600">
                Approval untuk penghubungan akun login ke master profile existing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadClaimRequests()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {claimError ? (
            <p className="font-body text-sm text-red-600">{claimError}</p>
          ) : null}

          {claimRequestsLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((item) => (
                <div key={item} className="h-16 rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : claimRequests.length === 0 ? (
            <p className="font-body text-sm text-slate-600">
              Tidak ada request claim yang menunggu review.
            </p>
          ) : (
            <div className="space-y-2">
              {claimRequests.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="font-body text-sm font-semibold text-slate-900">
                        {item.targetProfile?.displayName || "-"} ({item.nimInput || "-"})
                      </p>
                      <p className="font-body text-xs text-slate-600">
                        Requester: {item.requesterUser?.name || "-"} ({item.requesterEmail || "-"})
                      </p>
                      <p className="font-body text-xs text-slate-500">
                        Owner saat ini: {item.targetProfile?.ownerUser?.email || "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleClaimDecision(item.id, "approve")}
                        disabled={claimActionId === item.id}
                        className="rounded-lg bg-[#f97316] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#ea6c0a] disabled:opacity-60"
                      >
                        {claimActionId === item.id ? "Memproses..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleClaimDecision(item.id, "reject")}
                        disabled={claimActionId === item.id}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="h-1.5 bg-[#f97316]" />
        <div className="space-y-4 p-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900">Kru Database</h1>
            <p className="mt-1 font-body text-sm text-slate-600">
              Akses penuh data master kru. Semua field profil ditampilkan dan bisa difilter.
            </p>
          </div>

          <form
            className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void loadProfiles();
            }}
          >
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block font-body text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pencarian</label>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama / email / NIM..."
                className={inputClassName()}
              />
            </div>

            <div className="w-full md:w-auto min-w-[140px]">
              <label className="mb-1 block font-body text-[11px] font-semibold uppercase tracking-wide text-slate-500">Role</label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className={inputClassName()}
              >
                <option value="">Semua Role</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[160px]">
              <label className="mb-1 block font-body text-[11px] font-semibold uppercase tracking-wide text-slate-500">Kelengkapan</label>
              <select
                value={completeness}
                onChange={(event) => setCompleteness(event.target.value)}
                className={inputClassName()}
              >
                {COMPLETENESS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[160px]">
              <label className="mb-1 block font-body text-[11px] font-semibold uppercase tracking-wide text-slate-500">Filter Field</label>
              <select
                value={fieldKey}
                onChange={(event) => setFieldKey(event.target.value)}
                className={inputClassName()}
              >
                <option value="">(Pilih Field)</option>
                {fields.map((field) => (
                  <option key={field.key} value={field.key}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-auto min-w-[160px]">
              <label className="mb-1 block font-body text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nilai Field</label>
              <input
                type="text"
                value={fieldValue}
                onChange={(event) => setFieldValue(event.target.value)}
                placeholder={
                  activeField
                    ? `Cari di ${activeField.label}`
                    : "Pilih field dulu"
                }
                className={inputClassName()}
                disabled={!fieldKey}
              />
            </div>

            <div className="flex w-full gap-2 md:w-auto">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-slate-900 px-5 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-slate-800 md:flex-none"
              >
                Terapkan
              </button>
              <button
                type="button"
                onClick={() => {
                  const resetFilters = {
                    query: "",
                    roleFilter: "",
                    completeness: "all",
                    fieldKey: "",
                    fieldValue: "",
                  };
                  setQuery(resetFilters.query);
                  setRoleFilter(resetFilters.roleFilter);
                  setCompleteness(resetFilters.completeness);
                  setFieldKey(resetFilters.fieldKey);
                  setFieldValue(resetFilters.fieldValue);
                  void loadProfiles(resetFilters);
                }}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-body text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 md:flex-none"
              >
                Reset
              </button>
            </div>

            <div className="ml-auto flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 md:w-auto mt-2 md:mt-0">
              <div className="mr-6">
                <p className="font-body text-[11px] uppercase tracking-wide text-slate-500">
                  Ditampilkan
                </p>
                <p className="font-body text-sm font-semibold text-slate-800">
                  {meta.filteredTotal} / {meta.total}
                </p>
              </div>
              <a
                href={exportHref}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-[#f97316] px-4 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-[#ea6c0a]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </a>
            </div>
          </form>

          {meta.hasMore ? (
            <p className="font-body text-xs text-amber-700">
              Data dibatasi {meta.limit} baris pada tampilan. Export XLSX akan membawa seluruh hasil filter.
            </p>
          ) : null}

          {error ? <p className="font-body text-sm text-red-600">{error}</p> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        {loading ? (
          <KruDatabaseTableSkeleton />
        ) : items.length === 0 ? (
          <div className="p-6 font-body text-slate-600">Tidak ada data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Nama
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Email
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Role
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Updated
                  </th>
                  {dynamicColumns.map((field) => (
                    <th
                      key={field.key}
                      className="whitespace-nowrap px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-slate-600"
                      title={field.key}
                    >
                      {field.label}
                    </th>
                  ))}
                  <th className="sticky right-0 z-10 bg-slate-50 whitespace-nowrap px-4 py-3 text-center font-body text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-[-1px_0_0_rgba(226,232,240,1)]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const biodata = normalizeBiodata(item.biodata);
                  return (
                    <tr key={item.id} className="group align-top hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3 font-body text-slate-800">
                        {renderCell(biodata.fullName || item.displayName || item.user?.name)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-body text-slate-700">
                        {renderCell(item.user?.email)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-body text-slate-700">
                        {renderCell(item.user?.role)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-body text-slate-700">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleString("id-ID")
                          : "-"}
                      </td>
                      {dynamicColumns.map((field) => {
                        const cellValue = biodata[field.key];
                        const fileKeys =
                          field.fieldType === "file"
                            ? Array.from(new Set(extractFileKeysFromValue(cellValue)))
                            : [];

                        return (
                          <td
                            key={`${item.id}-${field.key}`}
                            className="max-w-[260px] px-4 py-3 font-body text-slate-700"
                            title={renderCell(cellValue)}
                          >
                            {field.fieldType === "file" ? (
                              <div className="flex flex-col gap-1">
                                {fileKeys.length === 0 ? (
                                  <span>-</span>
                                ) : (
                                  fileKeys.map((fileKey, index) => (
                                    <button
                                      key={`${fileKey}-${index}`}
                                      type="button"
                                      onClick={() => void handleDownloadFile(fileKey)}
                                      disabled={downloadingKey === fileKey}
                                      className="w-fit rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                    >
                                      {downloadingKey === fileKey
                                        ? "Mempersiapkan..."
                                        : `Download File ${index + 1}`}
                                    </button>
                                  ))
                                )}
                              </div>
                            ) : (
                              <div className="max-h-10 overflow-hidden break-words">
                                {renderCell(cellValue)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="sticky right-0 z-10 bg-white whitespace-nowrap px-4 py-3 text-center shadow-[-1px_0_0_rgba(226,232,240,1)] group-hover:bg-slate-50/70 transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditProfile(item)}
                            className="p-1.5 text-slate-400 hover:text-[#f97316] hover:bg-orange-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(item.id, biodata.fullName || item.displayName || item.user?.name)}
                            disabled={deletingId === item.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="Hapus"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
      {/* Edit Profile Modal */}
      {editingProfile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-slate-900">
                Edit Profil Kru
              </h3>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IconX />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {editError && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
                  {editError}
                </div>
              )}
              
              <form id="edit-profile-form" onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="mb-1 block font-body text-xs font-semibold text-slate-600">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className={inputClassName()}
                  />
                </div>
                
                {fields.map((field) => {
                  const typeByField = {
                    number: "number",
                    date: "date",
                    email: "email",
                    phone: "tel",
                    url: "url",
                  };
                  const inputType = typeByField[field.fieldType] || "text";
                  const value = editingBiodata[field.key] ?? "";
                  
                  return (
                    <div key={field.key}>
                      <label className="mb-1 flex items-center gap-1 font-body text-xs font-semibold text-slate-600">
                        {field.label}
                        {field.isRequired && <span className="text-red-500">*</span>}
                      </label>
                      
                      {field.fieldType === "textarea" ? (
                        <textarea
                          value={value}
                          onChange={(e) => setEditingBiodata((p) => ({ ...p, [field.key]: e.target.value }))}
                          className={`${inputClassName()} min-h-[80px]`}
                        />
                      ) : field.fieldType === "select" ? (
                        <select
                          value={value}
                          onChange={(e) => setEditingBiodata((p) => ({ ...p, [field.key]: e.target.value }))}
                          className={inputClassName()}
                        >
                          <option value="">(Kosong)</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.fieldType === "file" ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                          {value ? (
                            <div className="flex items-center justify-between">
                              <span className="truncate">Ada file terupload</span>
                              <button
                                type="button"
                                onClick={() => setEditingBiodata((p) => {
                                  const next = { ...p };
                                  delete next[field.key];
                                  return next;
                                })}
                                className="text-xs text-red-500 hover:underline"
                              >
                                Hapus File
                              </button>
                            </div>
                          ) : (
                            <input
                              type="file"
                              className="font-body text-sm text-slate-600"
                              onChange={async (event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;
                                setEditError("");
                                try {
                                  const key = await uploadFile(field.key, file, editingProfile.user?.id || editingProfile.id);
                                  setEditingBiodata((prev) => ({ ...prev, [field.key]: key }));
                                } catch (uploadError) {
                                  setEditError(uploadError.message || "Failed to upload file");
                                }
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          type={inputType}
                          value={value}
                          onChange={(e) => setEditingBiodata((p) => ({ ...p, [field.key]: e.target.value }))}
                          className={inputClassName()}
                        />
                      )}
                    </div>
                  );
                })}
              </form>
            </div>
            
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg px-4 py-2 font-body text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                form="edit-profile-form"
                disabled={savingEdit}
                className="rounded-lg bg-[#f97316] px-5 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-[#ea6c0a] disabled:opacity-50"
              >
                {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
