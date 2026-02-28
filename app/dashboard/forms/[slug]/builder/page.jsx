"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiDownload,
  FiExternalLink,
  FiFile,
  FiImage,
  FiList,
  FiMoreVertical,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiUpload,
  FiUsers,
  FiX,
} from "react-icons/fi";

const QUESTION_TYPE_OPTIONS = [
  { value: "short_text", label: "Jawaban singkat" },
  { value: "paragraph", label: "Paragraf" },
  { value: "single_choice", label: "Pilihan ganda" },
  { value: "multi_choice", label: "Kotak centang" },
  { value: "dropdown", label: "Drop-down" },
  { value: "linear_scale", label: "Skala linier" },
  { value: "mc_grid", label: "Kisi pilihan ganda" },
  { value: "checkbox_grid", label: "Petak kotak centang" },
  { value: "date", label: "Tanggal" },
  { value: "time", label: "Waktu" },
  { value: "file_upload", label: "Upload file" },
];

const OPTION_BASED_TYPES = new Set([
  "single_choice",
  "multi_choice",
  "dropdown",
]);
const BRANCHING_TYPES = new Set(["single_choice", "dropdown"]);
const GRID_TYPES = new Set(["mc_grid", "checkbox_grid"]);
const RESPONSE_OPTION_LIKE_TYPES = new Set([
  "single_choice",
  "dropdown",
  "linear_scale",
  "rating",
  "radio",
  "select",
]);

const VALID_TABS = new Set(["questions", "responses", "settings"]);

const FILE_MIME_PRESETS = [
  { value: "application/pdf", label: "PDF", icon: FiFile },
  { value: "image/jpeg", label: "JPG", icon: FiImage },
  { value: "image/png", label: "PNG", icon: FiImage },
  { value: "text/csv", label: "CSV", icon: FiFile },
];

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeSection(index) {
  return {
    id: uid("section"),
    title: `Bagian ${index + 1}`,
    description: "",
  };
}

function makeQuestion(sectionId, index) {
  return {
    id: uid("q"),
    key: uid("q"),
    sectionId,
    label: `Pertanyaan ${index + 1}`,
    description: "",
    fieldType: "short_text",
    isRequired: false,
    options: [{ id: uid("opt"), label: "Opsi 1", destinationSectionId: null }],
    scale: {
      min: 1,
      max: 5,
      minLabel: "",
      maxLabel: "",
    },
    grid: {
      rows: ["Baris 1"],
      columns: ["Kolom 1"],
    },
    fileConfig: {
      maxFiles: 1,
      maxSizeMB: 10,
      allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    },
  };
}

function ensureOptions(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return [{ id: uid("opt"), label: "Opsi 1", destinationSectionId: null }];
  }

  return options.map((option, index) => ({
    id:
      typeof option?.id === "string" && option.id.trim()
        ? option.id.trim()
        : uid(`opt_${index + 1}`),
    label:
      typeof option?.label === "string" && option.label.trim()
        ? option.label
        : `Opsi ${index + 1}`,
    destinationSectionId:
      typeof option?.destinationSectionId === "string"
        ? option.destinationSectionId
        : null,
  }));
}

function ensureQuestionShape(question) {
  const next = {
    ...question,
    label:
      typeof question.label === "string" && question.label.trim()
        ? question.label
        : "Pertanyaan tanpa judul",
    description:
      typeof question.description === "string" ? question.description : "",
    isRequired: Boolean(question.isRequired),
    options: ensureOptions(question.options),
    scale:
      question.scale && typeof question.scale === "object"
        ? {
            min: Number.isFinite(Number(question.scale.min))
              ? Number(question.scale.min)
              : 1,
            max: Number.isFinite(Number(question.scale.max))
              ? Number(question.scale.max)
              : 5,
            minLabel:
              typeof question.scale.minLabel === "string"
                ? question.scale.minLabel
                : "",
            maxLabel:
              typeof question.scale.maxLabel === "string"
                ? question.scale.maxLabel
                : "",
          }
        : {
            min: 1,
            max: 5,
            minLabel: "",
            maxLabel: "",
          },
    grid:
      question.grid && typeof question.grid === "object"
        ? {
            rows: Array.isArray(question.grid.rows)
              ? question.grid.rows.filter((row) => typeof row === "string")
              : ["Baris 1"],
            columns: Array.isArray(question.grid.columns)
              ? question.grid.columns.filter(
                  (column) => typeof column === "string",
                )
              : ["Kolom 1"],
          }
        : {
            rows: ["Baris 1"],
            columns: ["Kolom 1"],
          },
    fileConfig:
      question.fileConfig && typeof question.fileConfig === "object"
        ? {
            maxFiles: Math.max(1, Number(question.fileConfig.maxFiles) || 1),
            maxSizeMB: Math.max(1, Number(question.fileConfig.maxSizeMB) || 10),
            allowedMimeTypes: Array.isArray(
              question.fileConfig.allowedMimeTypes,
            )
              ? question.fileConfig.allowedMimeTypes.filter(
                  (item) => typeof item === "string",
                )
              : ["application/pdf", "image/jpeg", "image/png"],
          }
        : {
            maxFiles: 1,
            maxSizeMB: 10,
            allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
          },
  };

  if (OPTION_BASED_TYPES.has(next.fieldType)) {
    next.options = ensureOptions(next.options);
  }

  if (next.fieldType === "linear_scale") {
    const min = Number(next.scale.min) || 1;
    const max = Number(next.scale.max) || 5;
    next.scale = {
      ...next.scale,
      min: min,
      max: max > min ? max : min + 1,
    };
  }

  if (GRID_TYPES.has(next.fieldType)) {
    if (!Array.isArray(next.grid.rows) || next.grid.rows.length === 0) {
      next.grid.rows = ["Baris 1"];
    }
    if (!Array.isArray(next.grid.columns) || next.grid.columns.length === 0) {
      next.grid.columns = ["Kolom 1"];
    }
  }

  if (next.fieldType === "file_upload") {
    if (!Array.isArray(next.fileConfig.allowedMimeTypes)) {
      next.fileConfig.allowedMimeTypes = [];
    }
  }

  return next;
}

function normalizeBuilderSchema(schema) {
  const sections =
    Array.isArray(schema?.sections) && schema.sections.length > 0
      ? schema.sections.map((section, index) => ({
          id:
            typeof section?.id === "string" && section.id.trim()
              ? section.id.trim()
              : uid(`section_${index + 1}`),
          title:
            typeof section?.title === "string" && section.title.trim()
              ? section.title
              : `Bagian ${index + 1}`,
          description:
            typeof section?.description === "string" ? section.description : "",
        }))
      : [makeSection(0)];

  const sectionIdSet = new Set(sections.map((section) => section.id));

  const questions =
    Array.isArray(schema?.questions) && schema.questions.length > 0
      ? schema.questions
          .map((question, index) => {
            if (!question || typeof question !== "object") return null;
            const sectionId =
              typeof question.sectionId === "string" &&
              sectionIdSet.has(question.sectionId)
                ? question.sectionId
                : sections[0].id;

            return ensureQuestionShape({
              ...question,
              id:
                typeof question.id === "string" && question.id.trim()
                  ? question.id.trim()
                  : uid(`q_${index + 1}`),
              key:
                typeof question.key === "string" && question.key.trim()
                  ? question.key.trim()
                  : uid(`q_${index + 1}`),
              sectionId,
              fieldType:
                typeof question.fieldType === "string"
                  ? question.fieldType
                  : "short_text",
            });
          })
          .filter(Boolean)
      : [makeQuestion(sections[0].id, 0)];

  return {
    requestedProfileFields: Array.isArray(schema?.requestedProfileFields)
      ? schema.requestedProfileFields.filter((item) => typeof item === "string")
      : [],
    sections,
    questions,
    settings: {
      audienceMode: schema?.settings?.audienceMode || "INTERNAL_KRU",
      collectEmailMode: schema?.settings?.collectEmailMode || "none",
      responsePolicy: schema?.settings?.responsePolicy || "SINGLE_WITH_EDIT",
      isAcceptingResponses:
        typeof schema?.settings?.isAcceptingResponses === "boolean"
          ? schema.settings.isAcceptingResponses
          : true,
      deadlineAt: schema?.settings?.deadlineAt || "",
      closedMessageTitle: schema?.settings?.closedMessageTitle || "Form closed",
      closedMessageDescription:
        schema?.settings?.closedMessageDescription || "Form ini sudah ditutup.",
    },
    confirmation: {
      title: schema?.confirmation?.title || "Respons Anda telah direkam",
      message:
        schema?.confirmation?.message || "Terima kasih sudah mengisi form.",
      redirectUrl: schema?.confirmation?.redirectUrl || "",
    },
    consentText:
      schema?.consentText ||
      "Saya menyetujui penggunaan data profil yang diminta untuk form ini.",
  };
}

function normalizeDeadlineForSave(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function sanitizeSchemaForSave(schema, activeProfileFieldKeySet) {
  const normalized = normalizeBuilderSchema(schema);
  const sections =
    Array.isArray(normalized.sections) && normalized.sections.length > 0
      ? normalized.sections
      : [makeSection(0)];
  const validSectionIds = new Set(sections.map((section) => section.id));
  const fallbackSectionId = sections[0].id;

  const questions =
    Array.isArray(normalized.questions) && normalized.questions.length > 0
      ? normalized.questions.map((question) => {
          const shaped = ensureQuestionShape(question);
          const nextSectionId = validSectionIds.has(shaped.sectionId)
            ? shaped.sectionId
            : fallbackSectionId;

          const nextOptions = Array.isArray(shaped.options)
            ? shaped.options.map((option) => ({
                ...option,
                destinationSectionId:
                  typeof option.destinationSectionId === "string" &&
                  option.destinationSectionId !== "__submit__" &&
                  !validSectionIds.has(option.destinationSectionId)
                    ? null
                    : option.destinationSectionId,
              }))
            : [];

          return {
            ...shaped,
            sectionId: nextSectionId,
            options: nextOptions,
          };
        })
      : [makeQuestion(fallbackSectionId, 0)];

  const requestedProfileFields = Array.isArray(normalized.requestedProfileFields)
    ? normalized.requestedProfileFields.filter((key) =>
        activeProfileFieldKeySet.has(key),
      )
    : [];

  return {
    ...normalized,
    sections,
    questions,
    requestedProfileFields,
    settings: {
      ...normalized.settings,
      deadlineAt: normalizeDeadlineForSave(normalized.settings?.deadlineAt),
    },
  };
}

function toDatetimeLocalValue(value) {
  if (!value || typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoFromDatetimeLocal(value) {
  if (!value || typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function stringifyAnswer(value) {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    if (
      value.every(
        (item) =>
          item && typeof item === "object" && typeof item.name === "string",
      )
    ) {
      return value
        .map((item) => item.name || item.key)
        .filter(Boolean)
        .join(", ");
    }

    return value
      .map((item) => stringifyAnswer(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    if (typeof value.name === "string" && value.name.trim()) {
      return value.name.trim();
    }

    if (typeof value.key === "string" && value.key.trim()) {
      return value.key.trim();
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function extractFileEntries(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    const items = value
      .flatMap((entry) => extractFileEntries(entry))
      .filter(Boolean);
    const unique = new Map();
    for (const item of items) {
      if (!unique.has(item.key)) unique.set(item.key, item);
    }
    return Array.from(unique.values());
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const key =
      typeof value.key === "string"
        ? value.key.trim()
        : typeof value.url === "string"
          ? value.url.trim()
          : "";

    if (!key) return [];

    const name =
      typeof value.name === "string" && value.name.trim()
        ? value.name.trim()
        : key.split("/").pop() || key;

    return [{ key, name }];
  }

  return [];
}

function mapCollaboratorErrorMessage(code) {
  switch (code) {
    case "email_required":
      return "Email collaborator wajib diisi.";
    case "email_not_whitelisted":
      return "Email belum ada di whitelist, tambahkan dulu di menu whitelist.";
    case "owner_is_implicit":
      return "Email owner tidak perlu ditambahkan sebagai collaborator.";
    case "collaborator_not_found":
      return "Collaborator tidak ditemukan.";
    case "cannot_change_owner_role":
      return "Role owner tidak bisa diubah.";
    case "cannot_remove_owner":
      return "Owner tidak bisa dihapus dari collaborator.";
    case "Forbidden":
      return "Anda tidak punya izin untuk aksi collaborator ini.";
    default:
      return code || "Aksi collaborator gagal.";
  }
}

function getQuestionMetaMap(schemaSnapshot) {
  const map = new Map();
  const questions = Array.isArray(schemaSnapshot?.questions)
    ? schemaSnapshot.questions
    : [];

  for (const question of questions) {
    const key =
      typeof question?.id === "string" && question.id.trim()
        ? question.id.trim()
        : typeof question?.key === "string" && question.key.trim()
          ? question.key.trim()
          : "";

    if (!key || map.has(key)) continue;

    map.set(key, {
      key,
      label:
        typeof question?.label === "string" && question.label.trim()
          ? question.label.trim()
          : key,
      fieldType:
        typeof question?.fieldType === "string" ? question.fieldType : "",
    });
  }

  return map;
}

function extractRespondentEmail(answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers))
    return "";
  const respondentEmail = answers?._system?.respondentEmail;
  return typeof respondentEmail === "string" ? respondentEmail.trim() : "";
}

function normalizeProfileEntries(snapshot, requestedProfileKeys = []) {
  if (Array.isArray(snapshot?.fields)) {
    return snapshot.fields
      .filter(
        (field) => field && typeof field === "object" && !Array.isArray(field),
      )
      .map((field) => ({
        key: typeof field.key === "string" ? field.key : "",
        label:
          typeof field.label === "string" && field.label.trim()
            ? field.label.trim()
            : typeof field.key === "string"
              ? field.key
              : "",
        value: field.value,
      }))
      .filter((field) => field.key);
  }

  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
    const keys = Array.from(
      new Set([
        ...Object.keys(snapshot),
        ...requestedProfileKeys.filter((key) => typeof key === "string"),
      ]),
    );

    return keys.map((key) => ({
      key,
      label: key,
      value: snapshot[key],
    }));
  }

  return [];
}

function getSubmitterInfo(item, respondentEmail) {
  const name =
    typeof item?.submitterUser?.name === "string" &&
    item.submitterUser.name.trim()
      ? item.submitterUser.name.trim()
      : "";

  const email =
    typeof item?.submitterUser?.email === "string" &&
    item.submitterUser.email.trim()
      ? item.submitterUser.email.trim()
      : respondentEmail;

  return {
    name: name || (email ? "User" : "Anonymous"),
    email,
  };
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition ${
        checked ? "bg-[#f97316]" : "bg-slate-300"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function BuilderPageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-[#f97316]" />
        <div className="space-y-4 p-6">
          <div className="h-8 w-72 rounded bg-slate-200" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-11 rounded-lg bg-slate-100" />
            <div className="h-11 rounded-lg bg-slate-100" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-4 p-6">
          <div className="h-4 w-36 rounded bg-slate-200" />
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-20 rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-4 p-6">
          <div className="h-4 w-40 rounded bg-slate-200" />
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 rounded-lg bg-slate-100" />
          ))}
        </div>
      </section>
    </div>
  );
}

function ResponsesPanelSkeleton() {
  return (
    <div className="space-y-3 p-5 md:p-6 animate-pulse">
      <div className="h-5 w-44 rounded bg-slate-200" />
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-12 rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const tabFromUrl = searchParams.get("tab");
  const activeTab = VALID_TABS.has(tabFromUrl) ? tabFromUrl : "questions";
  const [activeElementId, setActiveElementId] = useState(null);

  const [eventMeta, setEventMeta] = useState({
    title: "",
    description: "",
  });

  const [versions, setVersions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [schemaState, setSchemaState] = useState(normalizeBuilderSchema({}));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [autoSaveError, setAutoSaveError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [responsesState, setResponsesState] = useState({ total: 0, items: [] });
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responsesError, setResponsesError] = useState("");
  const [exportingToDrive, setExportingToDrive] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [responsesLoaded, setResponsesLoaded] = useState(false);
  const [responsesTab, setResponsesTab] = useState("summary");
  const [responsesQuery, setResponsesQuery] = useState("");
  const [responseQuestionKey, setResponseQuestionKey] = useState("");
  const [individualSubmissionId, setIndividualSubmissionId] = useState("");
  const [downloadingKey, setDownloadingKey] = useState("");

  const [openSettingsPanel, setOpenSettingsPanel] = useState({
    responses: true,
    presentation: false,
    access: false,
  });
  const [collaborators, setCollaborators] = useState([]);
  const [canManageCollaborators, setCanManageCollaborators] = useState(false);
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaboratorError, setCollaboratorError] = useState("");
  const [collaboratorInfo, setCollaboratorInfo] = useState("");
  const [collaboratorSaving, setCollaboratorSaving] = useState(false);
  const [collaboratorBusyId, setCollaboratorBusyId] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const autosaveTimerRef = useRef(null);
  const autosavePausedRef = useRef(false);
  const lastSavedFingerprintRef = useRef("");
  const hasInitializedAutosaveRef = useRef(false);
  const baseDraftIdRef = useRef(null);
  const eventUpdatedAtRef = useRef("");

  const latestDraft = useMemo(
    () => versions.find((item) => item.status === "draft") || null,
    [versions],
  );

  const latestPublished = useMemo(() => {
    const published = versions.filter((item) => item.status === "published");
    return published[published.length - 1] || null;
  }, [versions]);

  const collaboratorsOrdered = useMemo(() => {
    return [...collaborators].sort((a, b) => {
      const rank = (item) => {
        if (item?.role === "owner") return 0;
        if (item?.role === "editor") return 1;
        return 2;
      };
      const byRole = rank(a) - rank(b);
      if (byRole !== 0) return byRole;
      const emailA = (a?.user?.email || "").toLowerCase();
      const emailB = (b?.user?.email || "").toLowerCase();
      return emailA.localeCompare(emailB);
    });
  }, [collaborators]);

  const autosaveStatusText = useMemo(() => {
    if (autoSaveStatus === "saving") return "Menyimpan otomatis...";
    if (autoSaveStatus === "pending") return "Perubahan terdeteksi...";
    if (autoSaveStatus === "error") return "Autosave gagal";
    if (lastSavedAt) {
      return `Tersimpan ${new Date(lastSavedAt).toLocaleTimeString("id-ID")}`;
    }
    return "Autosave aktif";
  }, [autoSaveStatus, lastSavedAt]);

  const autosaveStatusClass = useMemo(() => {
    if (autoSaveStatus === "error") return "text-red-600";
    if (autoSaveStatus === "saving" || autoSaveStatus === "pending") {
      return "text-amber-600";
    }
    return "text-slate-500";
  }, [autoSaveStatus]);

  const questionsBySection = useMemo(() => {
    const map = new Map();

    schemaState.sections.forEach((section) => {
      map.set(section.id, []);
    });

    schemaState.questions.forEach((question) => {
      if (!map.has(question.sectionId)) {
        map.set(question.sectionId, []);
      }
      map.get(question.sectionId).push(question);
    });

    return map;
  }, [schemaState.sections, schemaState.questions]);

  useEffect(() => {
    if (!eventSlug) return;
    void loadAll();
  }, [eventSlug]);

  useEffect(() => {
    if (activeTab !== "responses" || !eventSlug || responsesLoaded) return;
    void loadResponses();
  }, [activeTab, eventSlug, responsesLoaded]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!shareModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    void loadCollaborators();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setShareModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [shareModalOpen]);

  function changeTab(nextTab) {
    if (nextTab === activeTab) return;
    if (!eventSlug) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextTab === "questions") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", nextTab);
    }

    const query = nextParams.toString();
    const href = query
      ? `/dashboard/forms/${eventSlug}/builder?${query}`
      : `/dashboard/forms/${eventSlug}/builder`;
    router.replace(href, { scroll: false });
  }

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [eventRes, versionsRes, catalogRes] = await Promise.all([
        fetch(`/api/events/${eventSlug}`),
        fetch(`/api/events/${eventSlug}/form-versions`),
        fetch("/api/profile/catalog?activeOnly=1"),
      ]);

      if (!eventRes.ok) throw new Error("Failed to fetch form metadata");
      if (!versionsRes.ok) throw new Error("Failed to fetch form versions");
      if (!catalogRes.ok) throw new Error("Failed to fetch profile fields");

      const eventData = await eventRes.json();
      const versionsData = await versionsRes.json();
      const catalogData = await catalogRes.json();

      setEventMeta({
        title: eventData.title || "",
        description: eventData.description || "",
      });
      eventUpdatedAtRef.current =
        typeof eventData?.updatedAt === "string" ? eventData.updatedAt : "";

      setVersions(Array.isArray(versionsData) ? versionsData : []);
      setCatalog(Array.isArray(catalogData.items) ? catalogData.items : []);

      const sourceVersion =
        (Array.isArray(versionsData)
          ? versionsData.find((item) => item.status === "draft")
          : null) ||
        (Array.isArray(versionsData)
          ? [...versionsData]
              .filter((item) => item.status === "published")
              .sort((a, b) => a.version - b.version)
              .pop()
          : null);

      if (sourceVersion) {
        const normalized = normalizeBuilderSchema({
          requestedProfileFields: sourceVersion.requestedProfileFields,
          sections: sourceVersion.sections,
          questions: sourceVersion.questions,
          settings: sourceVersion.settings,
          confirmation: sourceVersion.confirmation,
          consentText: sourceVersion.consentText,
        });
        setSchemaState(normalized);
      } else {
        setSchemaState(normalizeBuilderSchema({}));
      }

      baseDraftIdRef.current =
        sourceVersion?.status === "draft" && typeof sourceVersion?.id === "string"
          ? sourceVersion.id
          : null;

      setResponsesLoaded(false);
      await loadResponseCount();
      await loadCollaborators();
      const initialFingerprint = buildSaveFingerprint({
        eventMetaInput: {
          title: eventData.title || "",
          description: eventData.description || "",
        },
        schemaInput: sourceVersion
          ? normalizeBuilderSchema({
              requestedProfileFields: sourceVersion.requestedProfileFields,
              sections: sourceVersion.sections,
              questions: sourceVersion.questions,
              settings: sourceVersion.settings,
              confirmation: sourceVersion.confirmation,
              consentText: sourceVersion.consentText,
            })
          : normalizeBuilderSchema({}),
        catalogInput: Array.isArray(catalogData.items) ? catalogData.items : [],
      });
      lastSavedFingerprintRef.current = initialFingerprint;
      hasInitializedAutosaveRef.current = true;
      autosavePausedRef.current = false;
      setAutoSaveStatus("saved");
      setLastSavedAt(Date.now());
      setAutoSaveError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load builder data");
    } finally {
      setLoading(false);
    }
  }

  function buildSavePayload({
    eventMetaInput = eventMeta,
    schemaInput = schemaState,
    catalogInput = catalog,
  } = {}) {
    const consentText =
      typeof schemaInput.consentText === "string"
        ? schemaInput.consentText.trim()
        : "";

    const activeProfileFieldKeySet = new Set(
      (Array.isArray(catalogInput) ? catalogInput : [])
        .map((field) => field?.key)
        .filter((key) => typeof key === "string"),
    );

    const payloadSchema = sanitizeSchemaForSave(
      schemaInput,
      activeProfileFieldKeySet,
    );

    return {
      consentText,
      payloadSchema,
      title: (eventMetaInput.title || "Formulir Tanpa Judul").trim(),
      description:
        typeof eventMetaInput.description === "string" &&
        eventMetaInput.description.trim()
          ? eventMetaInput.description.trim()
          : null,
    };
  }

  function buildSaveFingerprint({
    eventMetaInput = eventMeta,
    schemaInput = schemaState,
    catalogInput = catalog,
  } = {}) {
    const payload = buildSavePayload({
      eventMetaInput,
      schemaInput,
      catalogInput,
    });
    return JSON.stringify(payload);
  }

  async function saveDraftInternal({ manual = false } = {}) {
    setSaving(true);
    setAutoSaveError("");
    if (manual) {
      setError("");
    }

    const payload = buildSavePayload();
    let draftSaved = false;

    if (!payload.consentText) {
      setSaving(false);
      if (manual) {
        setError("Teks persetujuan wajib diisi.");
      } else {
        setAutoSaveStatus("error");
        setAutoSaveError("Teks persetujuan wajib diisi sebelum autosave.");
      }
      return false;
    }

    try {
      const draftResponse = await fetch(`/api/events/${eventSlug}/form-versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload.payloadSchema,
          consentText: payload.consentText,
          baseDraftId: baseDraftIdRef.current,
        }),
      });

      if (!draftResponse.ok) {
        const draftPayload = await draftResponse.json().catch(() => ({}));
        if (draftResponse.status === 409 && draftPayload?.error === "stale_draft_version") {
          const staleError = new Error(
            "Perubahan dari tab/perangkat lain terdeteksi. Muat ulang halaman untuk sinkronisasi data terbaru.",
          );
          staleError.code = "stale_conflict";
          throw staleError;
        }
        const details = Array.isArray(draftPayload?.details)
          ? draftPayload.details.filter((item) => typeof item === "string")
          : [];
        if (details.length > 0) {
          throw new Error(
            `${draftPayload.error || "Invalid form schema"}: ${details[0]}`,
          );
        }
        throw new Error(draftPayload.error || "Failed to save draft");
      }
      draftSaved = true;
      const savedDraft = await draftResponse.json().catch(() => null);

      const patchMetaResponse = await fetch(`/api/events/${eventSlug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          expectedUpdatedAt: eventUpdatedAtRef.current || undefined,
        }),
      });

      if (!patchMetaResponse.ok) {
        const patchPayload = await patchMetaResponse.json().catch(() => ({}));
        if (
          patchMetaResponse.status === 409 &&
          patchPayload?.error === "stale_event_metadata"
        ) {
          const staleError = new Error(
            "Metadata form berubah di tab/perangkat lain. Muat ulang halaman untuk melanjutkan.",
          );
          staleError.code = "stale_conflict";
          throw staleError;
        }
        throw new Error("Draft saved, but failed to save form metadata");
      }
      const updatedEvent = await patchMetaResponse.json().catch(() => null);

      if (savedDraft?.id) {
        setVersions((prev) => {
          const rest = prev.filter((item) => item.status !== "draft");
          return [...rest, savedDraft];
        });
        baseDraftIdRef.current = savedDraft.id;
      }

      if (updatedEvent?.updatedAt) {
        eventUpdatedAtRef.current = updatedEvent.updatedAt;
      }

      lastSavedFingerprintRef.current = buildSaveFingerprint();
      autosavePausedRef.current = false;
      setAutoSaveStatus("saved");
      setLastSavedAt(Date.now());
      if (manual) {
        setError("");
      }
      return true;
    } catch (saveError) {
      if (draftSaved) {
        try {
          await loadAll();
        } catch {}
      }
      if (manual) {
        setError(saveError.message || "Failed to save draft");
      } else {
        setAutoSaveStatus("error");
        if (saveError?.code === "stale_conflict") {
          autosavePausedRef.current = true;
        }
        setAutoSaveError(
          saveError.message || "Autosave gagal, coba lagi beberapa saat.",
        );
      }
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function loadCollaborators() {
    setCollaboratorsLoading(true);
    setCollaboratorError("");
    try {
      const response = await fetch(`/api/events/${eventSlug}/collaborators`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          mapCollaboratorErrorMessage(payload?.error || "Failed to fetch collaborators"),
        );
      }
      setCollaborators(Array.isArray(payload.items) ? payload.items : []);
      setCanManageCollaborators(Boolean(payload.canManage));
    } catch (loadError) {
      setCollaborators([]);
      setCanManageCollaborators(false);
      setCollaboratorError(
        loadError.message || "Failed to fetch collaborators",
      );
    } finally {
      setCollaboratorsLoading(false);
    }
  }

  async function loadResponseCount() {
    try {
      const response = await fetch(
        `/api/events/${eventSlug}/submissions?countOnly=1`,
      );
      if (!response.ok) {
        return;
      }

      const payload = await response.json().catch(() => ({}));
      setResponsesState((prev) => ({
        ...prev,
        total: Number(payload?.total || 0),
      }));
    } catch {
      // Keep existing total if lightweight count fetch fails.
    }
  }

  async function handleAddCollaborator(event) {
    event.preventDefault();
    const email = collaboratorEmail.trim().toLowerCase();
    if (!email) return;

    setCollaboratorSaving(true);
    setCollaboratorError("");
    setCollaboratorInfo("");

    try {
      const response = await fetch(`/api/events/${eventSlug}/collaborators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role: "editor",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          mapCollaboratorErrorMessage(payload?.error || "Failed to add collaborator"),
        );
      }

      const item = payload?.item;
      if (item && item.id) {
        setCollaborators((prev) => {
          const next = [...prev];
          const index = next.findIndex((entry) => entry.id === item.id);
          if (index >= 0) {
            next[index] = item;
            return next;
          }
          next.push(item);
          return next;
        });
      } else {
        await loadCollaborators();
      }

      setCollaboratorEmail("");
      setCollaboratorInfo("Collaborator berhasil ditambahkan.");
    } catch (saveError) {
      setCollaboratorError(
        saveError.message || "Failed to add collaborator",
      );
    } finally {
      setCollaboratorSaving(false);
    }
  }

  async function handleRemoveCollaborator(id) {
    if (!id) return;

    setCollaboratorBusyId(id);
    setCollaboratorError("");
    setCollaboratorInfo("");

    try {
      const response = await fetch(`/api/events/${eventSlug}/collaborators`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          mapCollaboratorErrorMessage(
            payload?.error || "Failed to remove collaborator",
          ),
        );
      }

      setCollaborators((prev) => prev.filter((entry) => entry.id !== id));
    } catch (removeError) {
      setCollaboratorError(
        removeError.message || "Failed to remove collaborator",
      );
    } finally {
      setCollaboratorBusyId("");
    }
  }

  async function handleCopyFormLink() {
    if (!eventSlug) return;
    const path = `/forms/${eventSlug}`;
    const absoluteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCollaboratorError("");
      setCollaboratorInfo("Link form berhasil disalin.");
    } catch {
      setCollaboratorError("Gagal menyalin link form.");
    }
  }

  async function loadResponses() {
    setResponsesLoading(true);
    setResponsesError("");

    try {
      const response = await fetch(`/api/events/${eventSlug}/submissions`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to fetch responses");
      }

      const payload = await response.json();
      setResponsesState({
        total: Number(payload.total || 0),
        items: Array.isArray(payload.items) ? payload.items : [],
      });
      setResponsesLoaded(true);
    } catch (loadError) {
      setResponsesError(loadError.message || "Failed to fetch responses");
    } finally {
      setResponsesLoading(false);
    }
  }

  function updateQuestion(questionId, updater) {
    setSchemaState((prev) => ({
      ...prev,
      questions: prev.questions.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    }));
  }

  function updateSection(sectionId, updater) {
    setSchemaState((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? updater(section) : section,
      ),
    }));
  }

  function setQuestionType(questionId, nextType) {
    updateQuestion(questionId, (question) =>
      ensureQuestionShape({
        ...question,
        fieldType: nextType,
      }),
    );
  }

  function addSection() {
    setSchemaState((prev) => {
      const section = makeSection(prev.sections.length);
      const question = makeQuestion(section.id, prev.questions.length);
      return {
        ...prev,
        sections: [...prev.sections, section],
        questions: [...prev.questions, question],
      };
    });
  }

  function removeSection(sectionId) {
    setSchemaState((prev) => {
      if (prev.sections.length <= 1) return prev;

      const nextSections = prev.sections.filter(
        (section) => section.id !== sectionId,
      );
      const fallbackSectionId = nextSections[0].id;

      const nextQuestions = prev.questions
        .filter((question) => question.sectionId !== sectionId)
        .map((question) => ({
          ...question,
          sectionId: nextSections.some(
            (section) => section.id === question.sectionId,
          )
            ? question.sectionId
            : fallbackSectionId,
          options: Array.isArray(question.options)
            ? question.options.map((option) => ({
                ...option,
                destinationSectionId:
                  option.destinationSectionId === sectionId
                    ? null
                    : option.destinationSectionId,
              }))
            : [],
        }));

      return {
        ...prev,
        sections: nextSections,
        questions:
          nextQuestions.length > 0
            ? nextQuestions
            : [makeQuestion(fallbackSectionId, 0)],
      };
    });
  }

  function addQuestion(sectionId) {
    setSchemaState((prev) => {
      const question = makeQuestion(sectionId, prev.questions.length);
      return {
        ...prev,
        questions: [...prev.questions, question],
      };
    });
  }

  function duplicateQuestion(questionId) {
    setSchemaState((prev) => {
      const index = prev.questions.findIndex(
        (question) => question.id === questionId,
      );
      if (index === -1) return prev;

      const source = prev.questions[index];
      const duplicated = ensureQuestionShape({
        ...source,
        id: uid("q"),
        key: uid("q"),
        label: `${source.label} (Salinan)`,
        options: Array.isArray(source.options)
          ? source.options.map((option) => ({
              ...option,
              id: uid("opt"),
            }))
          : [],
      });

      const nextQuestions = [...prev.questions];
      nextQuestions.splice(index + 1, 0, duplicated);

      return {
        ...prev,
        questions: nextQuestions,
      };
    });
  }

  function removeQuestion(questionId) {
    setSchemaState((prev) => {
      const nextQuestions = prev.questions.filter(
        (question) => question.id !== questionId,
      );
      if (nextQuestions.length > 0) {
        return {
          ...prev,
          questions: nextQuestions,
        };
      }

      return {
        ...prev,
        questions: [makeQuestion(prev.sections[0].id, 0)],
      };
    });
  }

  async function handleSaveDraft() {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    void saveDraftInternal({ manual: true });
  }

  async function handleRetryAutosave() {
    if (saving || publishing) return;
    autosavePausedRef.current = false;
    setAutoSaveStatus("saving");
    setAutoSaveError("");
    await saveDraftInternal({ manual: false });
  }

  async function handleReloadBuilderState() {
    autosavePausedRef.current = false;
    setAutoSaveError("");
    await loadAll();
  }

  useEffect(() => {
    if (!eventSlug || loading) return;
    if (!hasInitializedAutosaveRef.current) return;
    if (publishing) return;
    if (autosavePausedRef.current) return;

    const nextFingerprint = buildSaveFingerprint();
    if (nextFingerprint === lastSavedFingerprintRef.current) {
      return;
    }

    if (autoSaveStatus !== "error") {
      setAutoSaveError("");
    }
    setAutoSaveStatus("pending");
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      if (saving || publishing) return;
      setAutoSaveStatus("saving");
      void saveDraftInternal({ manual: false });
    }, 1200);
  }, [eventSlug, loading, publishing, saving, eventMeta, schemaState, catalog]);

  async function handlePublish() {
    if (!latestDraft) {
      setError("Simpan draft terlebih dahulu sebelum publish.");
      return;
    }

    setPublishing(true);
    setError("");

    try {
      const response = await fetch(
        `/api/events/${eventSlug}/form-versions/${latestDraft.id}/publish`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to publish form");
      }

      await loadAll();
      if (responsesLoaded) {
        await loadResponses();
      }
    } catch (publishError) {
      setError(publishError.message || "Failed to publish form");
    } finally {
      setPublishing(false);
    }
  }

  async function handleExportResponses() {
    setResponsesError("");

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
      setResponsesError(exportError.message || "Failed to export XLSX");
    }
  }

  async function handleExportToDrive() {
    setExportingToDrive(true);
    setResponsesError("");
    try {
      const response = await fetch(`/api/events/${eventSlug}/export/drive`, {
        method: "POST",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (payload?.error === "drive_not_authorized") {
          throw new Error(
            "Akses Google Drive belum diizinkan. Silakan keluar lalu masuk kembali untuk memberikan izin.",
          );
        }
        throw new Error(payload?.error || "Gagal mengekspor ke Google Sheets");
      }
      const { url } = await response.json();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (exportError) {
      setResponsesError(
        exportError.message || "Gagal mengekspor ke Google Sheets",
      );
    } finally {
      setExportingToDrive(false);
      setExportDropdownOpen(false);
    }
  }

  async function handleDownloadFile(fileKey, fileName = "") {
    if (!fileKey) return;
    setDownloadingKey(fileKey);
    setResponsesError("");

    try {
      const response = await fetch("/api/files/download-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: fileKey, fileName }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to build download URL");
      }

      const payload = await response.json();
      if (!payload.downloadUrl) {
        throw new Error("Download URL is empty");
      }

      window.open(payload.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setResponsesError(downloadError.message || "Failed to download file");
    } finally {
      setDownloadingKey("");
    }
  }

  const normalizedSubmissions = useMemo(() => {
    return responsesState.items.map((item) => {
      const answers =
        item?.answers &&
        typeof item.answers === "object" &&
        !Array.isArray(item.answers)
          ? item.answers
          : {};

      const questionMetaByKey = getQuestionMetaMap(item?.formSchemaSnapshot);
      const respondentEmail = extractRespondentEmail(answers);
      const submitter = getSubmitterInfo(item, respondentEmail);

      const answersWithoutSystem = Object.entries(answers)
        .filter(([key]) => key !== "_system")
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});

      const requestedProfileKeys = Array.isArray(
        item?.formSchemaSnapshot?.requestedProfileFields,
      )
        ? item.formSchemaSnapshot.requestedProfileFields
        : [];

      return {
        ...item,
        submitter,
        respondentEmail,
        questionMetaByKey,
        answersWithoutSystem,
        profileEntries: normalizeProfileEntries(
          item?.consentedProfileSnapshot,
          requestedProfileKeys,
        ),
      };
    });
  }, [responsesState.items]);

  const responseQuestions = useMemo(() => {
    const map = new Map();

    for (const submission of normalizedSubmissions) {
      for (const key of Object.keys(submission.answersWithoutSystem)) {
        if (!map.has(key)) {
          const meta = submission.questionMetaByKey.get(key);
          map.set(key, {
            key,
            label: meta?.label || key,
            fieldType: meta?.fieldType || "",
          });
        }
      }
    }

    return Array.from(map.values());
  }, [normalizedSubmissions]);

  const filteredSubmissions = useMemo(() => {
    const query = responsesQuery.trim().toLowerCase();
    if (!query) return normalizedSubmissions;

    return normalizedSubmissions.filter((submission) => {
      const baseTexts = [
        submission.submitter?.name || "",
        submission.submitter?.email || "",
        submission.respondentEmail || "",
      ].map((entry) => entry.toLowerCase());

      const answerTexts = Object.entries(submission.answersWithoutSystem)
        .flatMap(([key, value]) => {
          const meta = submission.questionMetaByKey.get(key);
          return [meta?.label || key, stringifyAnswer(value)];
        })
        .map((entry) => String(entry || "").toLowerCase());

      const profileTexts = submission.profileEntries
        .flatMap((field) => [
          field.label || field.key,
          stringifyAnswer(field.value),
        ])
        .map((entry) => String(entry || "").toLowerCase());

      return [...baseTexts, ...answerTexts, ...profileTexts].some((text) =>
        text.includes(query),
      );
    });
  }, [normalizedSubmissions, responsesQuery]);

  const selectedQuestion = useMemo(() => {
    return (
      responseQuestions.find(
        (question) => question.key === responseQuestionKey,
      ) || null
    );
  }, [responseQuestions, responseQuestionKey]);

  const selectedIndividualSubmission = useMemo(() => {
    return (
      filteredSubmissions.find(
        (submission) => submission.id === individualSubmissionId,
      ) || null
    );
  }, [filteredSubmissions, individualSubmissionId]);

  useEffect(() => {
    if (!responseQuestions.length) {
      setResponseQuestionKey("");
      return;
    }

    if (
      !responseQuestionKey ||
      !responseQuestions.some(
        (question) => question.key === responseQuestionKey,
      )
    ) {
      setResponseQuestionKey(responseQuestions[0].key);
    }
  }, [responseQuestions, responseQuestionKey]);

  useEffect(() => {
    if (!filteredSubmissions.length) {
      setIndividualSubmissionId("");
      return;
    }

    if (
      !individualSubmissionId ||
      !filteredSubmissions.some(
        (submission) => submission.id === individualSubmissionId,
      )
    ) {
      setIndividualSubmissionId(filteredSubmissions[0].id);
    }
  }, [filteredSubmissions, individualSubmissionId]);

  const selectedQuestionResponses = useMemo(() => {
    const counts = new Map();
    const textAnswers = [];
    const fileAnswers = [];

    if (!selectedQuestion?.key) {
      return {
        answeredSubmissionCount: 0,
        counts,
        textAnswers,
        fileAnswers,
      };
    }

    let answeredSubmissionCount = 0;

    for (const submission of filteredSubmissions) {
      const value = submission.answersWithoutSystem[selectedQuestion.key];
      if (!hasValue(value)) continue;

      answeredSubmissionCount += 1;
      const submitterText = submission.submitter.email
        ? `${submission.submitter.name} (${submission.submitter.email})`
        : submission.submitter.name;

      if (selectedQuestion.fieldType === "file_upload") {
        const files = extractFileEntries(value);
        if (files.length > 0) {
          fileAnswers.push({
            submissionId: submission.id,
            submitter: submitterText,
            files,
          });
          continue;
        }
      }

      if (
        selectedQuestion.fieldType === "multi_choice" &&
        Array.isArray(value)
      ) {
        for (const option of value) {
          const key = String(option);
          counts.set(key, (counts.get(key) || 0) + 1);
        }
        continue;
      }

      if (RESPONSE_OPTION_LIKE_TYPES.has(selectedQuestion.fieldType)) {
        const key = String(value);
        counts.set(key, (counts.get(key) || 0) + 1);
        continue;
      }

      textAnswers.push({
        submissionId: submission.id,
        submitter: submitterText,
        value: stringifyAnswer(value) || "-",
      });
    }

    return {
      answeredSubmissionCount,
      counts,
      textAnswers,
      fileAnswers,
    };
  }, [filteredSubmissions, selectedQuestion]);

  const selectedQuestionIndex = useMemo(
    () =>
      responseQuestions.findIndex(
        (question) => question.key === responseQuestionKey,
      ),
    [responseQuestionKey, responseQuestions],
  );

  const selectedIndividualIndex = useMemo(
    () =>
      filteredSubmissions.findIndex(
        (submission) => submission.id === individualSubmissionId,
      ),
    [filteredSubmissions, individualSubmissionId],
  );

  function switchResponseQuestion(step) {
    if (!responseQuestions.length) return;
    const currentIndex = selectedQuestionIndex >= 0 ? selectedQuestionIndex : 0;
    const nextIndex = Math.min(
      responseQuestions.length - 1,
      Math.max(0, currentIndex + step),
    );
    setResponseQuestionKey(responseQuestions[nextIndex].key);
  }

  function switchIndividual(step) {
    if (!filteredSubmissions.length) return;
    const currentIndex =
      selectedIndividualIndex >= 0 ? selectedIndividualIndex : 0;
    const nextIndex = Math.min(
      filteredSubmissions.length - 1,
      Math.max(0, currentIndex + step),
    );
    setIndividualSubmissionId(filteredSubmissions[nextIndex].id);
  }

  if (loading) {
    return <BuilderPageSkeleton />;
  }

  function renderQuestionPreview(question) {
    if (question.fieldType === "short_text") {
      return (
        <div className="mt-2 text-sm text-slate-500">
          <div className="w-full max-w-sm border-b border-slate-300 pb-1">
            Teks jawaban singkat
          </div>
        </div>
      );
    }

    if (question.fieldType === "paragraph") {
      return (
        <div className="mt-2 text-sm text-slate-500">
          <div className="w-full max-w-md border-b border-slate-300 pb-1">
            Teks jawaban panjang
          </div>
        </div>
      );
    }

    if (question.fieldType === "single_choice") {
      return (
        <div className="mt-2 space-y-2">
          {question.options.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <span className="h-4 w-4 rounded-full border border-slate-400" />
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      );
    }

    if (question.fieldType === "multi_choice") {
      return (
        <div className="mt-2 space-y-2">
          {question.options.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <span className="h-4 w-4 rounded-sm border border-slate-400" />
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      );
    }

    if (question.fieldType === "dropdown") {
      return (
        <div className="mt-2 max-w-xs rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Pilih dari daftar
        </div>
      );
    }

    if (question.fieldType === "linear_scale") {
      const min = Number(question.scale?.min) || 1;
      const max = Number(question.scale?.max) || 5;
      const range = Array.from(
        { length: max - min + 1 },
        (_, index) => min + index,
      );
      return (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {question.scale?.minLabel ? (
              <span>{question.scale.minLabel}</span>
            ) : null}
            {range.map((num) => (
              <span key={num} className="inline-flex items-center gap-1">
                <span className="h-3.5 w-3.5 rounded-full border border-slate-400" />
                {num}
              </span>
            ))}
            {question.scale?.maxLabel ? (
              <span>{question.scale.maxLabel}</span>
            ) : null}
          </div>
        </div>
      );
    }

    if (question.fieldType === "date" || question.fieldType === "time") {
      return (
        <div className="mt-2 max-w-xs rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {question.fieldType === "date" ? "Pilih tanggal" : "Pilih waktu"}
        </div>
      );
    }

    if (GRID_TYPES.has(question.fieldType)) {
      return (
        <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-slate-500">
                  Row
                </th>
                {question.grid.columns.map((column, columnIndex) => (
                  <th
                    key={`${column}-${columnIndex}`}
                    className="px-2 py-2 text-center font-semibold text-slate-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.grid.rows.map((row, rowIndex) => (
                <tr
                  key={`${row}-${rowIndex}`}
                  className="border-t border-slate-100"
                >
                  <td className="px-2 py-2 text-slate-600">{row}</td>
                  {question.grid.columns.map((column, columnIndex) => (
                    <td
                      key={`${column}-${columnIndex}`}
                      className="px-2 py-2 text-center"
                    >
                      <span className="inline-block h-3.5 w-3.5 rounded-full border border-slate-400" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (question.fieldType === "file_upload") {
      const activeMimes = Array.isArray(question.fileConfig.allowedMimeTypes)
        ? question.fileConfig.allowedMimeTypes
        : [];

      return (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <div>Maksimum file: {question.fileConfig.maxFiles}</div>
          <div>Batas ukuran: {question.fileConfig.maxSizeMB} MB / file</div>
          <div className="mt-1">
            Tipe: {activeMimes.length > 0 ? activeMimes.join(", ") : "Semua"}
          </div>
        </div>
      );
    }

    return null;
  }

  function renderOptionEditor(question) {
    const sectionOptions = schemaState.sections.map((section, index) => ({
      id: section.id,
      label: `${index + 1}. ${section.title || `Bagian ${index + 1}`}`,
    }));

    return (
      <div className="mt-3 space-y-2">
        {question.options.map((option, optionIndex) => (
          <div
            key={option.id}
            className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px_auto]"
          >
            <input
              type="text"
              value={option.label}
              onChange={(event) => {
                const nextLabel = event.target.value;
                updateQuestion(question.id, (current) => ({
                  ...current,
                  options: current.options.map((item) =>
                    item.id === option.id
                      ? { ...item, label: nextLabel }
                      : item,
                  ),
                }));
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
              placeholder={`Opsi ${optionIndex + 1}`}
            />

            {BRANCHING_TYPES.has(question.fieldType) ? (
              <select
                value={option.destinationSectionId || ""}
                onChange={(event) => {
                  const nextValue = event.target.value || null;
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    options: current.options.map((item) =>
                      item.id === option.id
                        ? {
                            ...item,
                            destinationSectionId: nextValue,
                          }
                        : item,
                    ),
                  }));
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Lanjutkan ke bagian berikutnya</option>
                {sectionOptions.map((section) => (
                  <option key={section.id} value={section.id}>
                    Ke {section.label}
                  </option>
                ))}
                <option value="__submit__">Kirim formulir</option>
              </select>
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                Tanpa branching
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                updateQuestion(question.id, (current) => {
                  if (current.options.length <= 1) return current;
                  return {
                    ...current,
                    options: current.options.filter(
                      (item) => item.id !== option.id,
                    ),
                  };
                });
              }}
              className="rounded-md border border-slate-300 px-2 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              title="Hapus opsi"
            >
              <FiTrash2 />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            updateQuestion(question.id, (current) => ({
              ...current,
              options: [
                ...current.options,
                {
                  id: uid("opt"),
                  label: `Opsi ${current.options.length + 1}`,
                  destinationSectionId: null,
                },
              ],
            }));
          }}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <FiPlus /> Tambah opsi
        </button>
      </div>
    );
  }

  function renderGridEditor(question) {
    return (
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Baris
          </p>
          {question.grid.rows.map((row, rowIndex) => (
            <div key={`${question.id}_row_${rowIndex}`} className="flex gap-2">
              <input
                type="text"
                value={row}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    grid: {
                      ...current.grid,
                      rows: current.grid.rows.map((item, itemIndex) =>
                        itemIndex === rowIndex ? nextValue : item,
                      ),
                    },
                  }));
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={() => {
                  updateQuestion(question.id, (current) => {
                    if (current.grid.rows.length <= 1) return current;
                    return {
                      ...current,
                      grid: {
                        ...current.grid,
                        rows: current.grid.rows.filter(
                          (_, itemIndex) => itemIndex !== rowIndex,
                        ),
                      },
                    };
                  });
                }}
                className="rounded-md border border-slate-300 px-2 text-slate-500 hover:bg-slate-50"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              updateQuestion(question.id, (current) => ({
                ...current,
                grid: {
                  ...current.grid,
                  rows: [
                    ...current.grid.rows,
                    `Baris ${current.grid.rows.length + 1}`,
                  ],
                },
              }));
            }}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FiPlus /> Tambah baris
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Kolom
          </p>
          {question.grid.columns.map((column, columnIndex) => (
            <div
              key={`${question.id}_col_${columnIndex}`}
              className="flex gap-2"
            >
              <input
                type="text"
                value={column}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    grid: {
                      ...current.grid,
                      columns: current.grid.columns.map((item, itemIndex) =>
                        itemIndex === columnIndex ? nextValue : item,
                      ),
                    },
                  }));
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={() => {
                  updateQuestion(question.id, (current) => {
                    if (current.grid.columns.length <= 1) return current;
                    return {
                      ...current,
                      grid: {
                        ...current.grid,
                        columns: current.grid.columns.filter(
                          (_, itemIndex) => itemIndex !== columnIndex,
                        ),
                      },
                    };
                  });
                }}
                className="rounded-md border border-slate-300 px-2 text-slate-500 hover:bg-slate-50"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              updateQuestion(question.id, (current) => ({
                ...current,
                grid: {
                  ...current.grid,
                  columns: [
                    ...current.grid.columns,
                    `Kolom ${current.grid.columns.length + 1}`,
                  ],
                },
              }));
            }}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FiPlus /> Tambah kolom
          </button>
        </div>
      </div>
    );
  }

  function renderFileUploadEditor(question) {
    const activeMimes = Array.isArray(question.fileConfig.allowedMimeTypes)
      ? question.fileConfig.allowedMimeTypes
      : [];

    return (
      <div className="mt-3 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Maksimum file
            <input
              type="number"
              min={1}
              value={question.fileConfig.maxFiles}
              onChange={(event) => {
                const value = Math.max(1, Number(event.target.value) || 1);
                updateQuestion(question.id, (current) => ({
                  ...current,
                  fileConfig: {
                    ...current.fileConfig,
                    maxFiles: value,
                  },
                }));
              }}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="text-sm text-slate-700">
            Maksimum ukuran / file (MB)
            <input
              type="number"
              min={1}
              value={question.fileConfig.maxSizeMB}
              onChange={(event) => {
                const value = Math.max(1, Number(event.target.value) || 10);
                updateQuestion(question.id, (current) => ({
                  ...current,
                  fileConfig: {
                    ...current.fileConfig,
                    maxSizeMB: value,
                  },
                }));
              }}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tipe file diizinkan
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FILE_MIME_PRESETS.map((preset) => {
              const checked = activeMimes.includes(preset.value);
              const Icon = preset.icon;

              return (
                <label
                  key={preset.value}
                  className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      updateQuestion(question.id, (current) => {
                        const currentMimes = Array.isArray(
                          current.fileConfig.allowedMimeTypes,
                        )
                          ? [...current.fileConfig.allowedMimeTypes]
                          : [];

                        const nextMimes = event.target.checked
                          ? Array.from(new Set([...currentMimes, preset.value]))
                          : currentMimes.filter(
                              (value) => value !== preset.value,
                            );

                        return {
                          ...current,
                          fileConfig: {
                            ...current.fileConfig,
                            allowedMimeTypes: nextMimes,
                          },
                        };
                      });
                    }}
                    className="h-4 w-4 accent-[#f97316]"
                  />
                  <Icon className="text-slate-500" />
                  <span>{preset.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderQuestionCard(question) {
    const isActive = activeElementId === question.id;

    return (
      <article
        key={question.id}
        className={`overflow-hidden rounded-xl border bg-[white] shadow-sm transition ${
          isActive
            ? "border-[#f97316] shadow-[0_0_0_2px_rgba(249,115,22,0.15)]"
            : "border-slate-200"
        }`}
        onClick={() => setActiveElementId(question.id)}
      >
        <div className="h-px w-full bg-slate-200" />
        <div className="space-y-4 p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
            <input
              type="text"
              value={question.label}
              onChange={(event) => {
                const nextLabel = event.target.value;
                updateQuestion(question.id, (current) => ({
                  ...current,
                  label: nextLabel,
                }));
              }}
              className="rounded-md border-b border-slate-300 bg-transparent px-1 py-2 text-xl font-medium text-slate-800 outline-none focus:border-[#f97316]"
              placeholder="Pertanyaan tanpa judul"
            />

            <select
              value={question.fieldType}
              onChange={(event) =>
                setQuestionType(question.id, event.target.value)
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
            >
              {QUESTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={question.description}
            onChange={(event) => {
              const nextDescription = event.target.value;
              updateQuestion(question.id, (current) => ({
                ...current,
                description: nextDescription,
              }));
            }}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#f97316] focus:bg-white"
            placeholder="Deskripsi pertanyaan (opsional)"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bagian
              <select
                value={question.sectionId}
                onChange={(event) => {
                  const nextSectionId = event.target.value;
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    sectionId: nextSectionId,
                  }));
                }}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
              >
                {schemaState.sections.map((section, index) => (
                  <option key={section.id} value={section.id}>
                    {index + 1}. {section.title || `Bagian ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>

            {question.fieldType === "linear_scale" ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Minimum
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={question.scale.min}
                    onChange={(event) => {
                      const nextMin = Math.max(
                        0,
                        Number(event.target.value) || 1,
                      );
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        scale: {
                          ...current.scale,
                          min: nextMin,
                          max:
                            Number(current.scale.max) > nextMin
                              ? Number(current.scale.max)
                              : nextMin + 1,
                        },
                      }));
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316]"
                  />
                </label>

                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Maksimum
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={question.scale.max}
                    onChange={(event) => {
                      const nextMax = Math.max(
                        1,
                        Number(event.target.value) || 5,
                      );
                      updateQuestion(question.id, (current) => {
                        const min = Number(current.scale.min) || 1;
                        return {
                          ...current,
                          scale: {
                            ...current.scale,
                            max: nextMax > min ? nextMax : min + 1,
                          },
                        };
                      });
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316]"
                  />
                </label>
              </div>
            ) : null}
          </div>

          {OPTION_BASED_TYPES.has(question.fieldType)
            ? renderOptionEditor(question)
            : null}

          {question.fieldType === "linear_scale" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={question.scale.minLabel}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    scale: {
                      ...current.scale,
                      minLabel: nextValue,
                    },
                  }));
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316]"
                placeholder="Label minimum"
              />
              <input
                type="text"
                value={question.scale.maxLabel}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    scale: {
                      ...current.scale,
                      maxLabel: nextValue,
                    },
                  }));
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316]"
                placeholder="Label maksimum"
              />
            </div>
          ) : null}

          {GRID_TYPES.has(question.fieldType)
            ? renderGridEditor(question)
            : null}

          {question.fieldType === "file_upload"
            ? renderFileUploadEditor(question)
            : null}

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pratinjau
            </p>
            {renderQuestionPreview(question)}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => duplicateQuestion(question.id)}
                className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:bg-slate-50"
                title="Duplikasi"
              >
                <FiCopy />
              </button>
              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:bg-slate-50"
                title="Hapus"
              >
                <FiTrash2 />
              </button>
            </div>

            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              Wajib diisi
              <Toggle
                checked={Boolean(question.isRequired)}
                onChange={() => {
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    isRequired: !current.isRequired,
                  }));
                }}
              />
            </label>
          </div>
        </div>
      </article>
    );
  }

  function renderQuestionsTab() {
    return (
      <div className="relative mx-auto max-w-[900px] space-y-6 pr-0 md:pr-20">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="h-2 bg-[#f97316]" />
          <div className="space-y-4 p-6 md:p-7">
            <input
              type="text"
              value={eventMeta.title}
              onChange={(event) => {
                setEventMeta((prev) => ({
                  ...prev,
                  title: event.target.value,
                }));
              }}
              className="w-full border-b border-transparent bg-transparent text-4xl font-medium text-slate-900 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f97316]"
              placeholder="Formulir tanpa judul"
            />

            <textarea
              value={eventMeta.description}
              onChange={(event) => {
                setEventMeta((prev) => ({
                  ...prev,
                  description: event.target.value,
                }));
              }}
              className="min-h-24 w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#f97316] focus:bg-white"
              placeholder="Deskripsi formulir"
            />

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>
                Pengumpulan email:{" "}
                <strong className="font-semibold text-slate-700">
                  {schemaState.settings.collectEmailMode === "required"
                    ? "Wajib"
                    : schemaState.settings.collectEmailMode === "optional"
                      ? "Opsional"
                      : "Tidak dikumpulkan"}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => changeTab("settings")}
                className="font-semibold text-[#f97316] hover:underline"
              >
                Ubah setelan
              </button>
            </div>
          </div>
        </section>

        {schemaState.sections.map((section, sectionIndex) => {
          const sectionQuestions = questionsBySection.get(section.id) || [];
          const isSectionActive = activeElementId === section.id;

          return (
            <section
              key={section.id}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                isSectionActive
                  ? "border-[#f97316] shadow-[0_0_0_2px_rgba(249,115,22,0.15)]"
                  : "border-slate-200"
              }`}
              onClick={() => setActiveElementId(section.id)}
            >
              <div className="h-1.5 bg-[#f97316]" />
              <div className="space-y-4 p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-semibold text-[#ea6c0a]">
                      Bagian {sectionIndex + 1} dari{" "}
                      {schemaState.sections.length}
                    </span>

                    <input
                      type="text"
                      value={section.title}
                      onChange={(event) => {
                        const nextTitle = event.target.value;
                        updateSection(section.id, (current) => ({
                          ...current,
                          title: nextTitle,
                        }));
                      }}
                      className="block w-full border-b border-transparent bg-transparent text-2xl font-semibold text-slate-900 outline-none hover:border-slate-300 focus:border-[#f97316]"
                      placeholder={`Bagian ${sectionIndex + 1}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    disabled={schemaState.sections.length <= 1}
                    className="rounded-md border border-slate-300 px-2.5 py-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Hapus bagian"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <textarea
                  value={section.description}
                  onChange={(event) => {
                    const nextDescription = event.target.value;
                    updateSection(section.id, (current) => ({
                      ...current,
                      description: nextDescription,
                    }));
                  }}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#f97316] focus:bg-white"
                  placeholder="Deskripsi bagian (opsional)"
                  rows={2}
                />

                <div className="space-y-3">
                  {sectionQuestions.map((question) =>
                    renderQuestionCard(question),
                  )}

                  <button
                    type="button"
                    onClick={() => addQuestion(section.id)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <FiPlus /> Tambah pertanyaan
                  </button>
                </div>
              </div>
            </section>
          );
        })}

        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-[#f97316] hover:text-[#f97316] w-full justify-center"
        >
          <FiPlus /> Tambah bagian
        </button>

        <div className="fixed bottom-6 right-6 z-20 hidden w-12 flex-col gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-lg md:flex">
          <button
            type="button"
            onClick={() => addQuestion(schemaState.sections[0].id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
            title="Tambah pertanyaan"
          >
            <FiPlus />
          </button>
          <button
            type="button"
            onClick={addSection}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
            title="Tambah bagian"
          >
            <FiList />
          </button>
          <button
            type="button"
            onClick={() => changeTab("settings")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
            title="Setelan"
          >
            <FiMoreVertical />
          </button>
        </div>
      </div>
    );
  }

  function renderResponseFileButtons(value) {
    const entries = extractFileEntries(value);
    if (!entries.length) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {entries.map((entry, index) => (
          <button
            key={`${entry.key}-${index}`}
            type="button"
            onClick={() => void handleDownloadFile(entry.key, entry.name)}
            disabled={downloadingKey === entry.key}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {downloadingKey === entry.key
              ? "Preparing..."
              : `Download ${entry.name || `File ${index + 1}`}`}
          </button>
        ))}
      </div>
    );
  }

  function renderResponsesTab() {
    return (
      <div className="mx-auto max-w-[900px] space-y-5">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-4 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-4xl font-semibold text-slate-900">
                {responsesState.total} jawaban
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadResponses()}
                  disabled={responsesLoading}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  <FiRefreshCw
                    className={responsesLoading ? "animate-spin" : ""}
                  />{" "}
                  Refresh
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExportDropdownOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    <FiDownload /> Ekspor <FiChevronDown />
                  </button>
                  {exportDropdownOpen && (
                    <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-slate-200 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={() => void handleExportToDrive()}
                        disabled={exportingToDrive}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        <FiExternalLink />
                        {exportingToDrive ? "Mengekspor..." : "Ekspor ke Google Sheets"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleExportResponses();
                          setExportDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <FiDownload /> Download XLSX
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-8 border-b border-slate-200 pb-2">
              {[
                { id: "summary", label: "Ringkasan" },
                { id: "question", label: "Pertanyaan" },
                { id: "individual", label: "Individual" },
              ].map((tab) => {
                const active = responsesTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setResponsesTab(tab.id)}
                    className={`border-b-2 pb-2 text-sm font-semibold transition ${
                      active
                        ? "border-[#f97316] text-[#f97316]"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={responsesQuery}
              onChange={(event) => setResponsesQuery(event.target.value)}
              placeholder="Cari submitter, jawaban, atau data profil"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
            />

            {responsesError ? (
              <p className="text-sm text-red-600">{responsesError}</p>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {responsesLoading ? (
            <ResponsesPanelSkeleton />
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Belum ada jawaban.
            </div>
          ) : (
            <div className="p-5 md:p-6">
              {responsesTab === "summary" ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Siapa yang sudah menjawab?
                    </p>
                    <div className="mt-3 grid gap-2">
                      {filteredSubmissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="rounded-md border border-slate-200 bg-white px-3 py-2"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {submission.submitter.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {submission.submitter.email || "-"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {submission.submittedAt
                              ? new Date(submission.submittedAt).toLocaleString(
                                  "id-ID",
                                )
                              : "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Statistik per pertanyaan
                    </p>
                    <div className="mt-3 space-y-2">
                      {responseQuestions.map((question) => {
                        const answeredCount = filteredSubmissions.filter(
                          (submission) =>
                            hasValue(
                              submission.answersWithoutSystem[question.key],
                            ),
                        ).length;

                        return (
                          <div
                            key={question.key}
                            className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                          >
                            <span className="text-sm text-slate-700">
                              {question.label}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {answeredCount} jawaban
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {responsesTab === "question" ? (
                <div className="space-y-6">
                  {responseQuestions.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                      Belum ada pertanyaan dengan respons.
                    </div>
                  ) : (
                    responseQuestions.map((question) => {
                      const counts = new Map();
                      const textAnswers = [];
                      const fileAnswers = [];
                      let answeredCount = 0;

                      for (const submission of filteredSubmissions) {
                        const value =
                          submission.answersWithoutSystem[question.key];
                        if (!hasValue(value)) continue;
                        answeredCount += 1;
                        const submitterText = submission.submitter.email
                          ? `${submission.submitter.name} (${submission.submitter.email})`
                          : submission.submitter.name;

                        if (question.fieldType === "file_upload") {
                          const files = extractFileEntries(value);
                          if (files.length > 0) {
                            fileAnswers.push({
                              submissionId: submission.id,
                              submitter: submitterText,
                              files,
                            });
                            continue;
                          }
                        }

                        if (
                          question.fieldType === "multi_choice" &&
                          Array.isArray(value)
                        ) {
                          for (const option of value) {
                            const k = String(option);
                            counts.set(k, (counts.get(k) || 0) + 1);
                          }
                          continue;
                        }

                        if (RESPONSE_OPTION_LIKE_TYPES.has(question.fieldType)) {
                          const k = String(value);
                          counts.set(k, (counts.get(k) || 0) + 1);
                          continue;
                        }

                        textAnswers.push({
                          submissionId: submission.id,
                          submitter: submitterText,
                          value: stringifyAnswer(value) || "-",
                        });
                      }

                      return (
                        <div
                          key={question.key}
                          className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-800">
                              {question.label}
                            </p>
                            <span className="text-xs text-slate-500">
                              {answeredCount} respons
                            </span>
                          </div>

                          {fileAnswers.length > 0 ? (
                            <div className="space-y-2">
                              {fileAnswers.map((entry) => (
                                <div
                                  key={entry.submissionId}
                                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                                >
                                  <p className="mb-2 text-xs text-slate-500">
                                    {entry.submitter}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {entry.files.map((file, index) => (
                                      <button
                                        key={`${entry.submissionId}-${file.key}-${index}`}
                                        type="button"
                                        onClick={() =>
                                          void handleDownloadFile(
                                            file.key,
                                            file.name,
                                          )
                                        }
                                        disabled={downloadingKey === file.key}
                                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                                      >
                                        {downloadingKey === file.key
                                          ? "Preparing..."
                                          : `Download ${file.name || `File ${index + 1}`}`}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : counts.size > 0 ? (
                            <div className="space-y-2">
                              {Array.from(counts.entries())
                                .sort((a, b) => b[1] - a[1])
                                .map(([option, count]) => {
                                  const maxCount = Math.max(
                                    ...Array.from(counts.values()),
                                  );
                                  const widthPct =
                            maxCount > 0 ? (count / maxCount) * 100 : 0;
                                  return (
                                    <div
                                      key={option}
                                      className="rounded-md border border-slate-200 bg-slate-50 p-3"
                                    >
                                      <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm text-slate-700">
                                          {option}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-600">
                                          {count}
                                        </span>
                                      </div>
                                      <div className="h-2 rounded-full bg-slate-200">
                                        <div
                                          className="h-2 rounded-full bg-[#f97316]"
                                          style={{ width: `${widthPct}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          ) : textAnswers.length > 0 ? (
                            <div className="space-y-2">
                              {textAnswers.map((entry) => (
                                <div
                                  key={entry.submissionId}
                                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                                >
                                  <p className="text-sm text-slate-900">
                                    {entry.value}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {entry.submitter}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                              Belum ada jawaban untuk pertanyaan ini.
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : null}

              {responsesTab === "individual" ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <select
                      value={individualSubmissionId}
                      onChange={(event) =>
                        setIndividualSubmissionId(event.target.value)
                      }
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                    >
                      {filteredSubmissions.map((submission) => (
                        <option key={submission.id} value={submission.id}>
                          {submission.submitter.email ||
                            submission.submitter.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <button
                        type="button"
                        onClick={() => switchIndividual(-1)}
                        disabled={selectedIndividualIndex <= 0}
                        className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40"
                      >
                        <FiChevronLeft />
                      </button>
                      <span>
                        {filteredSubmissions.length > 0
                          ? selectedIndividualIndex + 1
                          : 0}{" "}
                        dari {filteredSubmissions.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => switchIndividual(1)}
                        disabled={
                          selectedIndividualIndex === -1 ||
                          selectedIndividualIndex >=
                            filteredSubmissions.length - 1
                        }
                        className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>

                  {selectedIndividualSubmission ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedIndividualSubmission.submitter.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedIndividualSubmission.submitter.email || "-"} ·{" "}
                        {selectedIndividualSubmission.submittedAt
                          ? new Date(
                              selectedIndividualSubmission.submittedAt,
                            ).toLocaleString("id-ID")
                          : "-"}
                      </p>

                      {selectedIndividualSubmission.profileEntries.length >
                      0 ? (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Data Profil Direkam
                          </p>
                          <div className="mt-2 space-y-2">
                            {selectedIndividualSubmission.profileEntries.map(
                              (field) => (
                                <div
                                  key={`profile-${field.key}`}
                                  className="rounded-md border border-slate-100 bg-slate-50 p-2.5"
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    {field.label || field.key}
                                  </p>
                                  <div className="mt-1 text-sm text-slate-900">
                                    {renderResponseFileButtons(field.value) ||
                                      stringifyAnswer(field.value) ||
                                      "-"}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 space-y-2">
                        {responseQuestions.map((question) => {
                          const value =
                            selectedIndividualSubmission.answersWithoutSystem[
                              question.key
                            ];
                          const fileEntries =
                            question.fieldType === "file_upload"
                              ? extractFileEntries(value)
                              : [];

                          return (
                            <div
                              key={question.key}
                              className="rounded-md border border-slate-200 bg-white p-3"
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {question.label}
                              </p>
                              <div className="mt-1 text-sm text-slate-900">
                                {fileEntries.length > 0
                                  ? renderResponseFileButtons(value)
                                  : stringifyAnswer(value) || "-"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderSettingsPanel({ id, title, subtitle, children }) {
    const opened = openSettingsPanel[id];

    return (
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => {
            setOpenSettingsPanel((prev) => ({
              ...prev,
              [id]: !prev[id],
            }));
          }}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div>
            <p className="text-xl font-semibold text-slate-900">{title}</p>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          <FiChevronDown
            className={`text-slate-500 transition ${opened ? "rotate-180" : ""}`}
          />
        </button>
        {opened ? (
          <div className="space-y-4 border-t border-slate-200 p-5">
            {children}
          </div>
        ) : null}
      </section>
    );
  }

  function renderSettingsTab() {
    return (
      <div className="mx-auto max-w-[900px] space-y-5">
        {renderSettingsPanel({
          id: "responses",
          title: "Jawaban",
          subtitle: "Mengelola cara respons dikumpulkan dan dilindungi",
          children: (
            <>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Terima respons
                  </p>
                  <p className="text-xs text-slate-500">
                    Jika dimatikan, form langsung menampilkan pesan form
                    ditutup.
                  </p>
                </div>
                <Toggle
                  checked={Boolean(schemaState.settings.isAcceptingResponses)}
                  onChange={() => {
                    setSchemaState((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        isAcceptingResponses:
                          !prev.settings.isAcceptingResponses,
                      },
                    }));
                  }}
                />
              </div>

              <label className="block text-sm text-slate-700">
                Kumpulkan email
                <select
                  value={schemaState.settings.collectEmailMode}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSchemaState((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        collectEmailMode: nextValue,
                      },
                    }));
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                >
                  <option value="none">Tidak dikumpulkan</option>
                  <option value="optional">Opsional</option>
                  <option value="required">Wajib</option>
                </select>
              </label>

              <label className="block text-sm text-slate-700">
                Kebijakan jumlah respons
                <select
                  value={schemaState.settings.responsePolicy}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSchemaState((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        responsePolicy: nextValue,
                      },
                    }));
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                >
                  <option value="MULTIPLE">Boleh berkali-kali</option>
                  <option value="MULTIPLE_WITH_EDIT">
                    Boleh berkali-kali, boleh edit
                  </option>
                  <option value="SINGLE_WITH_EDIT">Sekali, boleh edit</option>
                  <option value="SINGLE_NO_EDIT">Sekali, tanpa edit</option>
                </select>
              </label>
            </>
          ),
        })}

        {renderSettingsPanel({
          id: "presentation",
          title: "Presentasi",
          subtitle: "Mengelola cara formulir dan respons dipresentasikan",
          children: (
            <>
              <label className="block text-sm text-slate-700">
                Deadline pengisian (opsional)
                <input
                  type="datetime-local"
                  value={toDatetimeLocalValue(schemaState.settings.deadlineAt)}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSchemaState((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        deadlineAt: toIsoFromDatetimeLocal(nextValue),
                      },
                    }));
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  Judul form ditutup
                  <input
                    type="text"
                    value={schemaState.settings.closedMessageTitle}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setSchemaState((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          closedMessageTitle: nextValue,
                        },
                      }));
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                  />
                </label>

                <label className="block text-sm text-slate-700">
                  Deskripsi form ditutup
                  <input
                    type="text"
                    value={schemaState.settings.closedMessageDescription}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setSchemaState((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          closedMessageDescription: nextValue,
                        },
                      }));
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  Judul konfirmasi
                  <input
                    type="text"
                    value={schemaState.confirmation.title}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setSchemaState((prev) => ({
                        ...prev,
                        confirmation: {
                          ...prev.confirmation,
                          title: nextValue,
                        },
                      }));
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                  />
                </label>

                <label className="block text-sm text-slate-700">
                  Pesan konfirmasi
                  <input
                    type="text"
                    value={schemaState.confirmation.message}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setSchemaState((prev) => ({
                        ...prev,
                        confirmation: {
                          ...prev.confirmation,
                          message: nextValue,
                        },
                      }));
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>

              <label className="block text-sm text-slate-700">
                Redirect URL setelah submit (opsional)
                <input
                  type="text"
                  value={schemaState.confirmation.redirectUrl}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSchemaState((prev) => ({
                      ...prev,
                      confirmation: {
                        ...prev.confirmation,
                        redirectUrl: nextValue,
                      },
                    }));
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                  placeholder="https://example.com/terima-kasih"
                />
              </label>
            </>
          ),
        })}

        {renderSettingsPanel({
          id: "access",
          title: "Akses & Profil",
          subtitle: "Atur audiens form dan data profil yang boleh direkam",
          children: (
            <>
              <label className="block text-sm text-slate-700">
                Audiens form
                <select
                  disabled
                  value={schemaState.settings.audienceMode}
                  className="mt-1 w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm opacity-60 outline-none"
                >
                  <option value="INTERNAL_KRU">Internal kru</option>
                  <option value="PUBLIC">Publik</option>
                </select>
              </label>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Profil yang direkam saat submit
                </p>

                {catalog.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {catalog.map((field) => {
                      const checked =
                        schemaState.requestedProfileFields.includes(field.key);
                      return (
                        <label
                          key={field.key}
                          className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              const active = event.target.checked;
                              setSchemaState((prev) => ({
                                ...prev,
                                requestedProfileFields: active
                                  ? Array.from(
                                      new Set([
                                        ...prev.requestedProfileFields,
                                        field.key,
                                      ]),
                                    )
                                  : prev.requestedProfileFields.filter(
                                      (key) => key !== field.key,
                                    ),
                              }));
                            }}
                            className="h-4 w-4 accent-[#f97316]"
                          />
                          <span>{field.label || field.key}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    Belum ada profile field aktif.
                  </p>
                )}
              </div>

              <label className="block text-sm text-slate-700">
                Teks persetujuan data profil
                <textarea
                  value={schemaState.consentText}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSchemaState((prev) => ({
                      ...prev,
                      consentText: nextValue,
                    }));
                  }}
                  rows={4}
                  className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                />
              </label>
            </>
          ),
        })}
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6 md:-mx-8 md:-my-8 min-h-safe-screen bg-gray-100">
      <header className="sticky top-16 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/dashboard/forms"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <FiArrowLeft className="text-lg" />
              </Link>

              <div className="min-w-0">
                <input
                  type="text"
                  value={eventMeta.title}
                  onChange={(event) => {
                    setEventMeta((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }));
                  }}
                  className="w-full min-w-[220px] border-b border-transparent bg-transparent text-lg font-medium text-slate-800 outline-none hover:border-slate-300 focus:border-[#f97316]"
                  placeholder="Formulir tanpa judul"
                />
                <p className="text-xs text-slate-500">
                  {latestPublished
                    ? `Published v${latestPublished.version}`
                    : "Belum dipublikasikan"}
                </p>
                <p className={`text-xs ${autosaveStatusClass}`}>{autosaveStatusText}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/forms/${eventSlug}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FiExternalLink /> Pratinjau
              </Link>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <FiSave /> {saving ? "Menyimpan..." : "Simpan"}
              </button>

              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                disabled={!canManageCollaborators}
                title={
                  canManageCollaborators
                    ? "Bagikan akses collaborator"
                    : "Anda tidak punya izin mengelola collaborator"
                }
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <FiUsers /> Bagikan
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || !latestDraft}
                className="inline-flex items-center gap-2 rounded-md bg-[#f97316] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ea6c0a] disabled:opacity-60"
              >
                <FiUpload /> {publishing ? "Publish..." : "Publikasikan"}
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <nav className="flex items-center gap-8 px-4 text-sm font-semibold">
              <button
                type="button"
                onClick={() => changeTab("questions")}
                className={`border-b-[3px] py-3 transition ${
                  activeTab === "questions"
                    ? "border-[#f97316] text-[#f97316]"
                    : "border-transparent text-slate-600 hover:text-slate-800"
                }`}
              >
                Pertanyaan
              </button>
              <button
                type="button"
                onClick={() => changeTab("responses")}
                className={`border-b-[3px] py-3 transition ${
                  activeTab === "responses"
                    ? "border-[#f97316] text-[#f97316]"
                    : "border-transparent text-slate-600 hover:text-slate-800"
                }`}
              >
                Jawaban
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1 text-xs text-slate-600">
                  {responsesState.total}
                </span>
              </button>
              <button
                type="button"
                onClick={() => changeTab("settings")}
                className={`border-b-[3px] py-3 transition ${
                  activeTab === "settings"
                    ? "border-[#f97316] text-[#f97316]"
                    : "border-transparent text-slate-600 hover:text-slate-800"
                }`}
              >
                Setelan
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 pb-24 md:px-6">
        {error ? (
          <div className="mx-auto mb-4 max-w-[900px] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {autoSaveStatus === "error" && autoSaveError ? (
          <div className="mx-auto mb-4 flex max-w-[900px] flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>{autoSaveError}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleRetryAutosave()}
                disabled={saving || publishing}
                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
              >
                Coba Autosave Lagi
              </button>
              <button
                type="button"
                onClick={() => void handleReloadBuilderState()}
                disabled={saving || publishing}
                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
              >
                Muat Ulang Data
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "questions" ? renderQuestionsTab() : null}
        {activeTab === "responses" ? renderResponsesTab() : null}
        {activeTab === "settings" ? renderSettingsTab() : null}
      </main>

      {shareModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Bagikan Akses Form
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola collaborator editor untuk form ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Link Form
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700">
                    /forms/{eventSlug}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopyFormLink()}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <FiCopy />
                    Copy link
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">Collaborators</p>
                <button
                  type="button"
                  onClick={() => void loadCollaborators()}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <FiRefreshCw /> Refresh
                </button>
              </div>

              {canManageCollaborators ? (
                <form
                  onSubmit={handleAddCollaborator}
                  className="grid gap-2 sm:grid-cols-[1fr_auto]"
                >
                  <input
                    type="email"
                    value={collaboratorEmail}
                    onChange={(event) => setCollaboratorEmail(event.target.value)}
                    placeholder="email collaborator"
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="submit"
                    disabled={collaboratorSaving}
                    className="rounded-md bg-[#f97316] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ea6c0a] disabled:opacity-60"
                  >
                    {collaboratorSaving ? "Menambahkan..." : "Tambahkan"}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-slate-500">
                  Anda tidak punya izin mengelola collaborator untuk form ini.
                </p>
              )}

              {collaboratorError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {collaboratorError}
                </p>
              ) : null}
              {collaboratorInfo ? (
                <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                  {collaboratorInfo}
                </p>
              ) : null}

              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {collaboratorsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-10 animate-pulse rounded-md bg-slate-100"
                      />
                    ))}
                  </div>
                ) : collaborators.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                    Belum ada collaborator.
                  </p>
                ) : (
                  collaboratorsOrdered.map((item) => {
                    const isOwner = item.role === "owner";
                    const isBusy = collaboratorBusyId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.user?.name || item.user?.email || "-"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {item.user?.email || "-"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOwner ? (
                            <span className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                              Owner
                            </span>
                          ) : (
                            <>
                              <span className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                Editor
                              </span>
                              {canManageCollaborators ? (
                                <button
                                  type="button"
                                  onClick={() => void handleRemoveCollaborator(item.id)}
                                  disabled={isBusy}
                                  className="rounded-md border border-red-200 bg-white px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                                >
                                  Hapus
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
