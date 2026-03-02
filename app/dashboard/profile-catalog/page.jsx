"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { hasAnyRole } from "@/lib/roleUtils";

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconText({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}
function IconTextarea({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </svg>
  );
}
function IconNumber({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}
function IconDate({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconSelect({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M15 12l-3 3-3-3" />
    </svg>
  );
}
function IconCheckbox({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <polyline points="5 7 6.5 8.5 9 6" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <polyline points="15 17 16.5 18.5 19 16" />
    </svg>
  );
}
function IconPhone({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.08 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}
function IconUrl({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconEmail({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconFile({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconCheck({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconX({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconGrid({ className = "w-8 h-8" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconPlus({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

const FIELD_TYPE_ICONS = {
  text: IconText,
  textarea: IconTextarea,
  number: IconNumber,
  date: IconDate,
  select: IconSelect,
  checkbox: IconCheckbox,
  phone: IconPhone,
  url: IconUrl,
  email: IconEmail,
  file: IconFile,
};

const FIELD_TYPES = [
  {
    value: "text",
    Icon: IconText,
    label: "Teks Singkat",
    desc: "Satu baris teks",
  },
  {
    value: "textarea",
    Icon: IconTextarea,
    label: "Teks Panjang",
    desc: "Paragraf / keterangan",
  },
  { value: "number", Icon: IconNumber, label: "Angka", desc: "Nilai numerik" },
  { value: "date", Icon: IconDate, label: "Tanggal", desc: "Pilih tanggal" },
  {
    value: "select",
    Icon: IconSelect,
    label: "Pilihan Tunggal",
    desc: "Dropdown pilihan",
  },
  {
    value: "checkbox",
    Icon: IconCheckbox,
    label: "Pilihan Ganda",
    desc: "Bisa pilih banyak",
  },
  {
    value: "phone",
    Icon: IconPhone,
    label: "Nomor Telepon",
    desc: "Format telepon",
  },
  { value: "url", Icon: IconUrl, label: "Tautan", desc: "URL / website" },
  { value: "email", Icon: IconEmail, label: "Email", desc: "Alamat email" },
  {
    value: "file",
    Icon: IconFile,
    label: "Upload File",
    desc: "Unggah dokumen",
  },
];

// Preset file type options shown in FileUploadConfig
const FILE_TYPE_PRESETS = [
  { value: "pdf", label: "PDF" },
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "docx", label: "DOCX" },
  { value: "xlsx", label: "XLSX" },
  { value: "mp3", label: "MP3" },
  { value: "mp4", label: "MP4" },
  { value: "zip", label: "ZIP" },
];

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors";

const SECTION_CLASS =
  "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]";

function toLabelCamelCase(str) {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) =>
      i === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
}

// ── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, size = "md" }) {
  const h = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const dot = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const on = size === "sm" ? "translate-x-4" : "translate-x-6";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex ${h} flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-1 ${
        checked ? "bg-[#f97316]" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block ${dot} transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? on : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ── Visual Type Picker ───────────────────────────────────────────────────────
function FieldTypePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {FIELD_TYPES.map(({ value: val, Icon, label, desc }) => {
        const active = value === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all duration-150 ${
              active
                ? "border-[#f97316] bg-orange-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/50"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${active ? "text-[#f97316]" : "text-slate-500"}`}
            />
            <span
              className={`font-body text-[11px] font-semibold leading-tight ${
                active ? "text-[#f97316]" : "text-slate-700"
              }`}
            >
              {label}
            </span>
            <span className="font-body text-[10px] leading-tight text-slate-400">
              {desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Options Tag Editor ───────────────────────────────────────────────────────
function OptionsEditor({ options, onChange }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  function addOption(raw) {
    const trimmed = raw.trim();
    if (!trimmed || options.includes(trimmed)) {
      setInput("");
      return;
    }
    onChange([...options, trimmed]);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addOption(input);
    } else if (e.key === "Backspace" && !input && options.length > 0) {
      onChange(options.slice(0, -1));
    }
  }

  return (
    <div>
      <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
        Pilihan Tersedia
      </label>
      <div
        className="flex min-h-[44px] cursor-text flex-wrap gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 transition-colors focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-orange-100"
        onClick={() => inputRef.current?.focus()}
      >
        {options.map((opt, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 font-body text-xs font-medium text-orange-800"
          >
            {opt}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(options.filter((_, j) => j !== i));
              }}
              className="rounded-full p-0.5 transition-colors hover:bg-orange-200"
            >
              <IconX className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addOption(input)}
          placeholder={
            options.length === 0
              ? "Ketik pilihan, tekan Enter untuk tambah…"
              : "Tambah pilihan…"
          }
          className="min-w-[160px] flex-1 bg-transparent font-body text-sm text-slate-900 placeholder:text-slate-400 outline-none"
        />
      </div>
      <p className="mt-1 font-body text-[11px] text-slate-400">
        Tekan Enter atau koma untuk menambah pilihan
      </p>
    </div>
  );
}

// ── File Upload Config ───────────────────────────────────────────────────────
// config shape: { allowedTypes: string[], maxSizeBytes: number | null }
function FileUploadConfig({ config, onChange }) {
  const allowedTypes = config?.allowedTypes ?? [];
  const maxSizeBytes = config?.maxSizeBytes ?? null;

  // Derive display value + unit from maxSizeBytes
  const [sizeUnit, setSizeUnit] = useState(() => {
    if (!maxSizeBytes) return "MB";
    return maxSizeBytes >= 1024 * 1024 ? "MB" : "KB";
  });
  const [sizeValue, setSizeValue] = useState(() => {
    if (!maxSizeBytes) return "";
    if (maxSizeBytes >= 1024 * 1024)
      return String(Math.round(maxSizeBytes / (1024 * 1024)));
    return String(Math.round(maxSizeBytes / 1024));
  });

  function toggleType(val) {
    const next = allowedTypes.includes(val)
      ? allowedTypes.filter((t) => t !== val)
      : [...allowedTypes, val];
    onChange({ ...config, allowedTypes: next });
  }

  function handleSizeChange(raw) {
    setSizeValue(raw);
    const num = parseInt(raw, 10);
    if (!raw || isNaN(num) || num <= 0) {
      onChange({ ...config, maxSizeBytes: null });
    } else {
      const bytes = sizeUnit === "MB" ? num * 1024 * 1024 : num * 1024;
      onChange({ ...config, maxSizeBytes: bytes });
    }
  }

  function handleUnitChange(unit) {
    setSizeUnit(unit);
    const num = parseInt(sizeValue, 10);
    if (!sizeValue || isNaN(num) || num <= 0) {
      onChange({ ...config, maxSizeBytes: null });
    } else {
      const bytes = unit === "MB" ? num * 1024 * 1024 : num * 1024;
      onChange({ ...config, maxSizeBytes: bytes });
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-4">
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500">
        Konfigurasi Upload File
      </p>

      {/* Allowed types */}
      <div>
        <label className="mb-2 block font-body text-xs font-semibold text-slate-600">
          Tipe file yang diizinkan
          <span className="ml-1 font-normal text-slate-400">
            (kosongkan = semua tipe)
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {FILE_TYPE_PRESETS.map(({ value, label }) => {
            const active = allowedTypes.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleType(value)}
                className={`rounded-full border px-3 py-1 font-body text-xs font-semibold transition-colors duration-150 ${
                  active
                    ? "border-[#f97316] bg-orange-50 text-[#f97316]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:text-orange-600"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max size */}
      <div>
        <label className="mb-1.5 block font-body text-xs font-semibold text-slate-600">
          Batas ukuran file
          <span className="ml-1 font-normal text-slate-400">
            (kosongkan = tidak ada batas)
          </span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={sizeValue}
            onChange={(e) => handleSizeChange(e.target.value)}
            placeholder="Contoh: 10"
            className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
          />
          <select
            value={sizeUnit}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-body text-sm text-slate-900 focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100 transition-colors"
          >
            <option value="KB">KB</option>
            <option value="MB">MB</option>
          </select>
          {maxSizeBytes ? (
            <span className="font-body text-xs text-slate-400">
              ={" "}
              {maxSizeBytes >= 1024 * 1024
                ? `${(maxSizeBytes / (1024 * 1024)).toFixed(1)} MB`
                : `${(maxSizeBytes / 1024).toFixed(0)} KB`}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Field Type Badge ─────────────────────────────────────────────────────────
function FieldTypeBadge({ fieldType }) {
  const type = FIELD_TYPES.find((t) => t.value === fieldType);
  const Icon = type ? type.Icon : IconText;
  const label = type ? type.label : fieldType;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-body text-xs font-medium text-slate-600">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function FieldSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-4 animate-pulse"
        >
          <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-slate-100" />
            <div className="h-3 w-1/5 rounded bg-slate-100" />
          </div>
          <div className="h-5 w-9 rounded-full bg-slate-100" />
          <div className="h-7 w-12 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function ProfileCatalogPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className={SECTION_CLASS}>
        <div className="h-1.5 bg-[#f97316]" />
        <div className="space-y-3 px-6 py-5">
          <div className="h-8 w-72 rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="h-6 w-40 rounded-full bg-slate-100" />
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <div className="h-1.5 bg-[#f97316]" />
        <div className="space-y-3 p-6">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-11 rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      </section>

      <section className={SECTION_CLASS}>
        <div className="h-1.5 bg-[#f97316]" />
        <div className="px-6 pt-5 pb-4">
          <div className="h-6 w-44 rounded bg-slate-200" />
        </div>
        <FieldSkeleton />
      </section>
    </div>
  );
}

// ── Helper: format bytes for display ─────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

// ── Single Field Row ─────────────────────────────────────────────────────────
function FieldRow({ item, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState("");

  const typeMeta = FIELD_TYPES.find((t) => t.value === item.fieldType);
  const TypeIcon = typeMeta ? typeMeta.Icon : IconText;
  const hasOptions =
    item.fieldType === "select" || item.fieldType === "checkbox";
  const isFile = item.fieldType === "file";

  function startEdit() {
    setDraft({
      label: item.label ?? "",
      description: item.description ?? "",
      fieldType: item.fieldType,
      isRequired: Boolean(item.isRequired),
      options: Array.isArray(item.options) ? [...item.options] : [],
      metadata: item.metadata
        ? { ...item.metadata }
        : { allowedTypes: [], maxSizeBytes: null },
    });
    setRowError("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
    setRowError("");
  }

  async function saveEdit() {
    if (!draft.label.trim()) {
      setRowError("Label tidak boleh kosong");
      return;
    }
    setSaving(true);
    setRowError("");
    try {
      await onUpdate(item.id, {
        label: draft.label.trim(),
        description: draft.description.trim() || null,
        fieldType: draft.fieldType,
        isRequired: draft.isRequired,
        options:
          draft.fieldType === "select" || draft.fieldType === "checkbox"
            ? draft.options
            : null,
        metadata: draft.fieldType === "file" ? draft.metadata : null,
      });
      setEditing(false);
    } catch (err) {
      setRowError(err.message ?? "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  const draftHasOptions =
    draft && (draft.fieldType === "select" || draft.fieldType === "checkbox");
  const draftIsFile = draft && draft.fieldType === "file";

  // File config summary for display row
  const fileAllowedTypes = isFile && item.metadata?.allowedTypes;
  const fileMaxBytes = isFile && item.metadata?.maxSizeBytes;
  const hasFileConfig =
    (Array.isArray(fileAllowedTypes) && fileAllowedTypes.length > 0) ||
    Boolean(fileMaxBytes);

  return (
    <div
      className={`border-b border-slate-100 last:border-0 transition-colors duration-150 ${
        editing ? "bg-orange-50/40" : "hover:bg-slate-50/40"
      }`}
    >
      <div className="flex items-start gap-4 px-6 py-4">
        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <TypeIcon className="w-5 h-5 text-slate-500" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-sm font-semibold text-slate-900">
              {item.label || "—"}
            </span>
            {item.isRequired && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-red-600">
                Wajib
              </span>
            )}
            {!item.isActive && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Nonaktif
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <code className="font-mono text-[11px] text-slate-400">
              {item.key}
            </code>
            <FieldTypeBadge fieldType={item.fieldType} />
          </div>
          {item.description ? (
            <p className="mt-1 font-body text-xs leading-relaxed text-slate-500">
              {item.description}
            </p>
          ) : null}
          {hasOptions &&
          Array.isArray(item.options) &&
          item.options.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.options.slice(0, 4).map((opt, i) => (
                <span
                  key={i}
                  className="rounded-full bg-slate-100 px-2 py-0.5 font-body text-[11px] text-slate-600"
                >
                  {opt}
                </span>
              ))}
              {item.options.length > 4 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-body text-[11px] text-slate-500">
                  +{item.options.length - 4} lainnya
                </span>
              )}
            </div>
          ) : null}
          {/* File config summary */}
          {isFile && hasFileConfig ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {Array.isArray(fileAllowedTypes) && fileAllowedTypes.length > 0
                ? fileAllowedTypes.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-blue-50 px-2 py-0.5 font-body text-[11px] font-medium text-blue-600"
                    >
                      {t.toUpperCase()}
                    </span>
                  ))
                : null}
              {fileMaxBytes ? (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 font-body text-[11px] font-medium text-blue-600">
                  maks {formatBytes(fileMaxBytes)}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <Toggle
            size="sm"
            checked={Boolean(item.isActive)}
            onChange={(val) => onUpdate(item.id, { isActive: val })}
          />
          <button
            type="button"
            onClick={editing ? cancelEdit : startEdit}
            className={`rounded-lg px-3 py-1.5 font-body text-xs font-semibold transition-colors ${
              editing
                ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {editing ? "Batal" : "Edit"}
          </button>
        </div>
      </div>

      {editing && draft ? (
        <div className="border-t border-orange-100 bg-orange-50/30 px-6 pb-5 pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Label *
                </label>
                <input
                  type="text"
                  value={draft.label}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, label: e.target.value }))
                  }
                  className={INPUT_CLASS}
                  placeholder="Nama field yang ditampilkan ke pengguna"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Deskripsi
                </label>
                <input
                  type="text"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, description: e.target.value }))
                  }
                  className={INPUT_CLASS}
                  placeholder="Penjelasan opsional untuk pengisi form"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tipe Field
              </label>
              <FieldTypePicker
                value={draft.fieldType}
                onChange={(val) => setDraft((p) => ({ ...p, fieldType: val }))}
              />
            </div>

            {draftHasOptions ? (
              <OptionsEditor
                options={draft.options}
                onChange={(opts) => setDraft((p) => ({ ...p, options: opts }))}
              />
            ) : null}

            {draftIsFile ? (
              <FileUploadConfig
                config={draft.metadata}
                onChange={(meta) => setDraft((p) => ({ ...p, metadata: meta }))}
              />
            ) : null}

            <div className="flex items-center justify-between border-t border-orange-100 pt-3">
              <label className="inline-flex cursor-pointer items-center gap-3 select-none">
                <Toggle
                  checked={draft.isRequired}
                  onChange={(val) =>
                    setDraft((p) => ({ ...p, isRequired: val }))
                  }
                />
                <span className="font-body text-sm text-slate-700">
                  Wajib diisi
                </span>
              </label>
              <div className="flex items-center gap-2">
                {rowError ? (
                  <p className="font-body text-xs text-red-600">{rowError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg px-4 py-2 font-body text-sm text-slate-600 transition-colors hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving || !draft.label.trim()}
                  className="rounded-lg bg-[#f97316] px-4 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-[#ea6c0a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-300">
        <IconGrid className="w-8 h-8" />
      </div>
      <h3 className="font-heading font-semibold text-slate-800">
        Belum ada field
      </h3>
      <p className="mt-1 font-body text-sm text-slate-500">
        Tambah field biodata pertama untuk mulai mengumpulkan data kru.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#f97316] px-5 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-[#ea6c0a]"
      >
        <IconPlus className="w-4 h-4" />
        Tambah Field Pertama
      </button>
    </div>
  );
}

// ── Add Field Form ───────────────────────────────────────────────────────────
function AddFieldForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState(emptyNewField());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function emptyNewField() {
    return {
      key: "",
      label: "",
      description: "",
      fieldType: "text",
      isRequired: false,
      options: [],
      metadata: { allowedTypes: [], maxSizeBytes: null },
    };
  }

  function handleLabelChange(val) {
    setField((prev) => ({
      ...prev,
      label: val,
      key: toLabelCamelCase(val),
    }));
  }

  const showOptions =
    field.fieldType === "select" || field.fieldType === "checkbox";
  const showFileConfig = field.fieldType === "file";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!field.label.trim()) {
      setError("Label wajib diisi");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/profile/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: field.key.trim() || toLabelCamelCase(field.label),
          label: field.label.trim(),
          description: field.description.trim() || null,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          options: showOptions ? field.options : null,
          metadata: showFileConfig ? field.metadata : null,
          isActive: true,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Gagal membuat field");
      }
      const created = await res.json();
      setSuccess(`Field "${created.label}" berhasil ditambahkan.`);
      setField(emptyNewField());
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err.message ?? "Gagal membuat field");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={SECTION_CLASS}>
      <div className="h-1.5 bg-[#f97316]" />
      {success ? (
        <div className="flex items-center gap-3 border-b border-green-100 bg-green-50 px-6 py-3">
          <IconCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="font-body text-sm text-green-700">{success}</p>
          <button
            onClick={() => setSuccess("")}
            className="ml-auto text-green-400 hover:text-green-600 transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      ) : null}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900">
              Tambah Field Baru
            </h2>
            <p className="mt-0.5 font-body text-sm text-slate-500">
              Buat field biodata baru untuk dikumpulkan dari kru.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-body text-sm font-semibold transition-all duration-200 ${
              open
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-[#f97316] text-white hover:bg-[#ea6c0a]"
            }`}
          >
            <span
              className={`inline-block transition-transform duration-200 ${open ? "rotate-45" : ""}`}
            >
              <IconPlus className="w-4 h-4" />
            </span>
            {open ? "Tutup" : "Tambah Field"}
          </button>
        </div>

        {open ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Label only — key hidden, auto-derived */}
            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
                Label *
              </label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className={INPUT_CLASS}
                placeholder="Contoh: Nama Lengkap, NIM, Fakultas"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
                Deskripsi
              </label>
              <input
                type="text"
                value={field.description}
                onChange={(e) =>
                  setField((p) => ({ ...p, description: e.target.value }))
                }
                className={INPUT_CLASS}
                placeholder="Penjelasan opsional untuk membantu pengisi form"
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tipe Field *
              </label>
              <FieldTypePicker
                value={field.fieldType}
                onChange={(val) => setField((p) => ({ ...p, fieldType: val }))}
              />
            </div>

            {showOptions ? (
              <OptionsEditor
                options={field.options}
                onChange={(opts) => setField((p) => ({ ...p, options: opts }))}
              />
            ) : null}

            {showFileConfig ? (
              <FileUploadConfig
                config={field.metadata}
                onChange={(meta) => setField((p) => ({ ...p, metadata: meta }))}
              />
            ) : null}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <label className="inline-flex cursor-pointer items-center gap-3 select-none">
                <Toggle
                  checked={field.isRequired}
                  onChange={(val) =>
                    setField((p) => ({ ...p, isRequired: val }))
                  }
                />
                <span className="font-body text-sm text-slate-700">
                  Wajib diisi
                </span>
              </label>
              <div className="flex items-center gap-3">
                {error ? (
                  <p className="font-body text-xs text-red-600">{error}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setField(emptyNewField());
                    setError("");
                  }}
                  className="rounded-lg px-4 py-2 font-body text-sm text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || !field.label.trim()}
                  className="rounded-lg bg-[#f97316] px-6 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-[#ea6c0a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Menyimpan…" : "Tambah Field"}
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ProfileCatalogPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasAccess = hasAnyRole(session?.user?.role, ["DATA", "DEVELOPER"]);

  useEffect(() => {
    if (status === "authenticated" && hasAccess) {
      void loadCatalog();
    }
  }, [status, hasAccess]);

  async function loadCatalog() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile/catalog");
      if (!res.ok) throw new Error("Gagal memuat daftar field");
      const payload = await res.json();
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (err) {
      setError(err.message ?? "Gagal memuat daftar field");
    } finally {
      setLoading(false);
    }
  }

  async function updateField(id, updates) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
    try {
      const res = await fetch("/api/profile/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Gagal memperbarui field");
      }
      const updated = await res.json();
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      await loadCatalog();
      throw err;
    }
  }

  if (status === "loading") {
    return <ProfileCatalogPageSkeleton />;
  }

  if (!hasAccess) {
    return (
      <div className={SECTION_CLASS}>
        <div className="h-1.5 bg-[#f97316]" />
        <div className="p-6">
          <p className="font-body text-sm text-red-600">
            Akses ditolak. Halaman ini hanya untuk DATA/DEVELOPER.
          </p>
        </div>
      </div>
    );
  }

  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className="space-y-6 text-slate-900">
      <section className={SECTION_CLASS}>
        <div className="h-1.5 bg-[#f97316]" />
        <div className="px-6 py-5">
          <h1 className="font-heading text-2xl font-bold text-slate-900">
            Master Profile Field Catalog
          </h1>
          <p className="mt-1 font-body text-sm text-slate-500">
            Kelola field biodata kru yang digunakan untuk mengisi form internal
            secara otomatis.
          </p>
          {!loading && items.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-body text-xs text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                {items.length} field terdaftar
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 font-body text-xs text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {activeCount} aktif
              </span>
              {items.length - activeCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-body text-xs text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  {items.length - activeCount} nonaktif
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <AddFieldForm onCreated={loadCatalog} />

      <section className={SECTION_CLASS}>
        <div className="h-1.5 bg-[#f97316]" />
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="font-heading text-xl font-bold text-slate-900">
            Daftar Field
          </h2>
          {!loading && items.length > 0 ? (
            <span className="font-body text-sm text-slate-400">
              {items.length} field
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="font-body text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        {loading ? (
          <FieldSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            onAdd={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
        ) : (
          <div className="pb-2">
            {items.map((item) => (
              <FieldRow key={item.id} item={item} onUpdate={updateField} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
