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
const COMPLETENESS_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "complete", label: "Lengkap (field wajib)" },
  { value: "incomplete", label: "Belum lengkap" },
];

function inputClassName() {
  return "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100";
}

function renderCell(value) {
  const text = stringifyProfileValue(value);
  return text || "-";
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

  useEffect(() => {
    if (status === "authenticated" && hasAccess) {
      void loadProfiles();
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

  if (status === "loading") {
    return <div className="font-body text-slate-600">Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="font-body text-red-600">
        Akses ditolak. Halaman ini hanya untuk DATA/DEVELOPER.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900">
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
            className="grid grid-cols-1 gap-3 md:grid-cols-5"
            onSubmit={(event) => {
              event.preventDefault();
              void loadProfiles();
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama / email / NIM / nilai field"
              className={`${inputClassName()} md:col-span-2`}
            />

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className={inputClassName()}
            >
              <option value="">Semua role</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

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

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white"
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
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-body text-sm font-semibold text-slate-700"
              >
                Reset
              </button>
            </div>

            <select
              value={fieldKey}
              onChange={(event) => setFieldKey(event.target.value)}
              className={`${inputClassName()} md:col-span-2`}
            >
              <option value="">Filter berdasarkan field (opsional)</option>
              {fields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label} ({field.key})
                </option>
              ))}
            </select>

            <input
              type="text"
              value={fieldValue}
              onChange={(event) => setFieldValue(event.target.value)}
              placeholder={
                activeField
                  ? `Nilai untuk ${activeField.label}`
                  : "Nilai field (opsional)"
              }
              className={`${inputClassName()} md:col-span-2`}
              disabled={!fieldKey}
            />

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-1">
              <div>
                <p className="font-body text-[11px] uppercase tracking-wide text-slate-500">
                  Ditampilkan
                </p>
                <p className="font-body text-sm font-semibold text-slate-800">
                  {meta.filteredTotal} / {meta.total}
                </p>
              </div>
              <a
                href={exportHref}
                className="rounded-lg bg-[#f97316] px-3 py-1.5 font-body text-xs font-semibold text-white"
              >
                Export XLSX
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
          <div className="p-6 font-body text-slate-600">Loading profiles...</div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const biodata = normalizeBiodata(item.biodata);
                  return (
                    <tr key={item.id} className="align-top hover:bg-slate-50/70">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
