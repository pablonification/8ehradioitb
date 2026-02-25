"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FiPlus,
  FiSave,
  FiUpload,
  FiExternalLink,
  FiTrash2,
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

function makeSection(index) {
  return {
    id: `section_${Date.now()}_${index}`,
    title: `Bagian ${index + 1}`,
    description: "",
  };
}

function makeQuestion(sectionId, index) {
  return {
    id: `q_${Date.now()}_${index}`,
    key: `q_${Date.now()}_${index}`,
    sectionId,
    label: "Pertanyaan baru",
    description: "",
    fieldType: "short_text",
    isRequired: false,
    options: [
      { id: `opt_${Date.now()}_1`, label: "Opsi 1", destinationSectionId: null },
    ],
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

function parseCommaValues(raw) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBuilderSchema(schema) {
  const firstSection = schema?.sections?.[0] || makeSection(0);
  return {
    requestedProfileFields: Array.isArray(schema?.requestedProfileFields)
      ? schema.requestedProfileFields
      : [],
    sections:
      Array.isArray(schema?.sections) && schema.sections.length > 0
        ? schema.sections
        : [firstSection],
    questions: Array.isArray(schema?.questions)
      ? schema.questions
      : [makeQuestion(firstSection.id, 0)],
    settings: {
      audienceMode: schema?.settings?.audienceMode || "INTERNAL_KRU",
      collectEmailMode: schema?.settings?.collectEmailMode || "none",
      responsePolicy: schema?.settings?.responsePolicy || "SINGLE_WITH_EDIT",
      isAcceptingResponses:
        typeof schema?.settings?.isAcceptingResponses === "boolean"
          ? schema.settings.isAcceptingResponses
          : true,
      deadlineAt: schema?.settings?.deadlineAt || "",
      closedMessageTitle:
        schema?.settings?.closedMessageTitle || "Form closed",
      closedMessageDescription:
        schema?.settings?.closedMessageDescription ||
        "Form ini sudah ditutup.",
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

export default function FormBuilderPage() {
  const params = useParams();
  const eventSlug = params.slug;

  const [eventMeta, setEventMeta] = useState({ title: "", description: "" });
  const [versions, setVersions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [schemaState, setSchemaState] = useState(normalizeBuilderSchema({}));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const sectionMap = useMemo(() => {
    const map = new Map();
    schemaState.sections.forEach((section) => map.set(section.id, section));
    return map;
  }, [schemaState.sections]);

  const latestDraft = useMemo(
    () => versions.find((item) => item.status === "draft") || null,
    [versions],
  );

  const latestPublished = useMemo(() => {
    const published = versions.filter((item) => item.status === "published");
    return published[published.length - 1] || null;
  }, [versions]);

  useEffect(() => {
    if (!eventSlug) return;
    void loadAll();
  }, [eventSlug]);

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
        setSchemaState(
          normalizeBuilderSchema({
            requestedProfileFields: sourceVersion.requestedProfileFields,
            sections: sourceVersion.sections,
            questions: sourceVersion.questions,
            settings: sourceVersion.settings,
            confirmation: sourceVersion.confirmation,
            consentText: sourceVersion.consentText,
          }),
        );
      }
    } catch (loadError) {
      setError(loadError.message || "Failed to load builder data");
    } finally {
      setLoading(false);
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

  function removeQuestion(questionId) {
    setSchemaState((prev) => ({
      ...prev,
      questions: prev.questions.filter((question) => question.id !== questionId),
    }));
  }

  function addSection() {
    setSchemaState((prev) => {
      const section = makeSection(prev.sections.length);
      return {
        ...prev,
        sections: [...prev.sections, section],
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

  function removeSection(sectionId) {
    setSchemaState((prev) => {
      if (prev.sections.length <= 1) {
        return prev;
      }

      const nextSections = prev.sections.filter((section) => section.id !== sectionId);
      const fallbackSectionId = nextSections[0].id;
      return {
        ...prev,
        sections: nextSections,
        questions: prev.questions.map((question) =>
          question.sectionId === sectionId
            ? { ...question, sectionId: fallbackSectionId }
            : question,
        ),
      };
    });
  }

  async function handleSaveDraft() {
    setSaving(true);
    setError("");

    try {
      const patchMeta = await fetch(`/api/events/${eventSlug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: eventMeta.title,
          description: eventMeta.description,
        }),
      });

      if (!patchMeta.ok) {
        throw new Error("Failed to save form metadata");
      }

      const response = await fetch(`/api/events/${eventSlug}/form-versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schemaState),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to save draft");
      }

      await loadAll();
    } catch (saveError) {
      setError(saveError.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  }

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
    } catch (publishError) {
      setError(publishError.message || "Failed to publish form");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return <div className="font-body text-slate-600">Loading builder...</div>;
  }

  return (
    <div className="form-builder-surface mx-auto max-w-[1200px] space-y-6 text-slate-900">
      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="h-1.5 bg-[#f97316]" />
        <div className="p-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">
              Builder: {eventSlug}
            </h1>
            <p className="text-sm font-body text-slate-600 mt-1">
              Edit pertanyaan, section, response policy, dan halaman konfirmasi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/forms/${eventSlug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-body font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiExternalLink /> Preview
            </Link>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-body font-semibold text-white disabled:opacity-60"
            >
              <FiSave /> {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || !latestDraft}
              className="inline-flex items-center gap-2 rounded-lg bg-[#f97316] px-3 py-2 text-sm font-body font-semibold text-white disabled:opacity-60"
            >
              <FiUpload /> {publishing ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600 font-body mt-3">{error}</p> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
          <input
            type="text"
            value={eventMeta.title}
            onChange={(event) =>
              setEventMeta((prev) => ({ ...prev, title: event.target.value }))
            }
            className="px-3 py-2 rounded-lg border border-slate-300 font-body"
            placeholder="Judul form"
          />
          <input
            type="text"
            value={eventMeta.description}
            onChange={(event) =>
              setEventMeta((prev) => ({ ...prev, description: event.target.value }))
            }
            className="px-3 py-2 rounded-lg border border-slate-300 font-body"
            placeholder="Deskripsi form"
          />
        </div>
        </div>
      </section>

      <section className="bg-white border border-slate-300 rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="font-heading font-bold text-lg text-slate-900">Form Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm font-body text-slate-800">
            Audience
            <select
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
              value={schemaState.settings.audienceMode}
              onChange={(event) =>
                setSchemaState((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    audienceMode: event.target.value,
                  },
                }))
              }
            >
              <option value="INTERNAL_KRU">Internal Kru</option>
              <option value="PUBLIC">Public</option>
            </select>
          </label>

          <label className="text-sm font-body text-slate-800">
            Response Policy
            <select
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
              value={schemaState.settings.responsePolicy}
              onChange={(event) =>
                setSchemaState((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    responsePolicy: event.target.value,
                  },
                }))
              }
            >
              <option value="MULTIPLE">Bisa submit berkali-kali</option>
              <option value="SINGLE_NO_EDIT">Satu kali, tidak bisa edit</option>
              <option value="SINGLE_WITH_EDIT">Satu kali, bisa edit</option>
            </select>
          </label>

          <label className="text-sm font-body text-slate-800">
            Collect Email (Public)
            <select
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
              value={schemaState.settings.collectEmailMode}
              onChange={(event) =>
                setSchemaState((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    collectEmailMode: event.target.value,
                  },
                }))
              }
            >
              <option value="none">Tidak collect</option>
              <option value="optional">Opsional</option>
              <option value="required">Wajib</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm font-body text-slate-800">
            Deadline (opsional)
            <input
              type="datetime-local"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
              value={schemaState.settings.deadlineAt || ""}
              onChange={(event) =>
                setSchemaState((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    deadlineAt: event.target.value,
                  },
                }))
              }
            />
          </label>

          <label className="text-sm font-body text-slate-800">
            Closed Title
            <input
              type="text"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
              value={schemaState.settings.closedMessageTitle}
              onChange={(event) =>
                setSchemaState((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    closedMessageTitle: event.target.value,
                  },
                }))
              }
            />
          </label>

          <label className="text-sm font-body text-slate-800">
            Closed Description
            <input
              type="text"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
              value={schemaState.settings.closedMessageDescription}
              onChange={(event) =>
                setSchemaState((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    closedMessageDescription: event.target.value,
                  },
                }))
              }
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-body text-slate-800">
          <input
            type="checkbox"
            checked={schemaState.settings.isAcceptingResponses}
            onChange={(event) =>
              setSchemaState((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  isAcceptingResponses: event.target.checked,
                },
              }))
            }
          />
          Terima respons
        </label>
      </section>

      <section className="bg-white border border-slate-300 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-heading font-bold text-lg text-slate-900">
          Requested Kru Data (Internal)
        </h2>
        <p className="text-sm font-body text-slate-600">
          Field berikut akan ditampilkan untuk consent sebelum submit.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {catalog.map((field) => {
            const active = schemaState.requestedProfileFields.includes(field.key);
            return (
              <label
                key={field.id}
                className="inline-flex items-start gap-2 text-sm font-body text-slate-800"
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSchemaState((prev) => {
                      const current = new Set(prev.requestedProfileFields);
                      if (checked) {
                        current.add(field.key);
                      } else {
                        current.delete(field.key);
                      }
                      return {
                        ...prev,
                        requestedProfileFields: Array.from(current),
                      };
                    });
                  }}
                />
                <span>
                  {field.label}
                  <span className="block text-xs text-slate-600">{field.key}</span>
                </span>
              </label>
            );
          })}
        </div>

        <label className="block text-sm font-body text-slate-800">
          Consent Text
          <textarea
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 min-h-20"
            value={schemaState.consentText}
            onChange={(event) =>
              setSchemaState((prev) => ({ ...prev, consentText: event.target.value }))
            }
          />
        </label>
      </section>

      <section className="bg-white border border-slate-300 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-heading font-bold text-lg text-slate-900">Thank You Page</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm font-body text-slate-800">
            Title
            <input
              type="text"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
              value={schemaState.confirmation.title}
              onChange={(event) =>
                setSchemaState((prev) => ({
                  ...prev,
                  confirmation: {
                    ...prev.confirmation,
                    title: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label className="text-sm font-body text-slate-800 md:col-span-2">
            Message
            <input
              type="text"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
              value={schemaState.confirmation.message}
              onChange={(event) =>
                setSchemaState((prev) => ({
                  ...prev,
                  confirmation: {
                    ...prev.confirmation,
                    message: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label className="text-sm font-body text-slate-800 md:col-span-3">
            Redirect URL (opsional)
            <input
              type="text"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
              value={schemaState.confirmation.redirectUrl}
              onChange={(event) =>
                setSchemaState((prev) => ({
                  ...prev,
                  confirmation: {
                    ...prev.confirmation,
                    redirectUrl: event.target.value,
                  },
                }))
              }
              placeholder="contoh: 8ehradioitb.com/sukses atau /thank-you"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        {schemaState.sections.map((section) => {
          const sectionQuestions = schemaState.questions.filter(
            (question) => question.sectionId === section.id,
          );

          return (
            <div
              key={section.id}
              className="bg-white border border-slate-300 rounded-2xl p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      setSchemaState((prev) => ({
                        ...prev,
                        sections: prev.sections.map((item) =>
                          item.id === section.id ? { ...item, title } : item,
                        ),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-heading font-semibold"
                    placeholder="Judul section"
                  />
                  <input
                    type="text"
                    value={section.description}
                    onChange={(event) => {
                      const description = event.target.value;
                      setSchemaState((prev) => ({
                        ...prev,
                        sections: prev.sections.map((item) =>
                          item.id === section.id ? { ...item, description } : item,
                        ),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-body"
                    placeholder="Deskripsi section"
                  />
                </div>

                <button
                  onClick={() => removeSection(section.id)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-body"
                >
                  <FiTrash2 /> Hapus Section
                </button>
              </div>

              <div className="space-y-3">
                {sectionQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="border border-slate-300 rounded-lg p-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={question.label}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                        className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 font-body"
                        placeholder="Pertanyaan"
                      />
                      <select
                        value={question.fieldType}
                        onChange={(event) => {
                          const fieldType = event.target.value;
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            fieldType,
                            options:
                              fieldType === "single_choice" ||
                              fieldType === "multi_choice" ||
                              fieldType === "dropdown"
                                ? current.options.length > 0
                                  ? current.options
                                  : [{
                                      id: `opt_${Date.now()}_1`,
                                      label: "Opsi 1",
                                      destinationSectionId: null,
                                    }]
                                : [],
                          }));
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-300 font-body"
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
                      onChange={(event) =>
                        updateQuestion(question.id, (current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-body"
                      placeholder="Deskripsi pertanyaan"
                    />

                    {(question.fieldType === "single_choice" ||
                      question.fieldType === "multi_choice" ||
                      question.fieldType === "dropdown") && (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={option.id} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={option.label}
                              onChange={(event) =>
                                updateQuestion(question.id, (current) => ({
                                  ...current,
                                  options: current.options.map((currentOption) =>
                                    currentOption.id === option.id
                                      ? {
                                          ...currentOption,
                                          label: event.target.value,
                                        }
                                      : currentOption,
                                  ),
                                }))
                              }
                              className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300"
                              placeholder={`Opsi ${optionIndex + 1}`}
                            />
                            <select
                              value={option.destinationSectionId || ""}
                              onChange={(event) => {
                                const destinationSectionId = event.target.value || null;
                                updateQuestion(question.id, (current) => ({
                                  ...current,
                                  options: current.options.map((currentOption) =>
                                    currentOption.id === option.id
                                      ? {
                                          ...currentOption,
                                          destinationSectionId,
                                        }
                                      : currentOption,
                                  ),
                                }));
                              }}
                              disabled={question.fieldType === "multi_choice"}
                              className="px-3 py-2 rounded-lg border border-slate-300"
                            >
                              <option value="">Ikuti urutan normal</option>
                              {schemaState.sections.map((item) => (
                                <option key={item.id} value={item.id}>
                                  Ke: {item.title}
                                </option>
                              ))}
                              <option value="__submit__">Langsung submit</option>
                            </select>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            updateQuestion(question.id, (current) => ({
                              ...current,
                              options: [
                                ...current.options,
                                {
                                  id: `opt_${Date.now()}_${current.options.length + 1}`,
                                  label: `Opsi ${current.options.length + 1}`,
                                  destinationSectionId: null,
                                },
                              ],
                            }))
                          }
                          className="text-sm font-body font-semibold text-[#ea580c]"
                        >
                          + Tambah opsi
                        </button>
                      </div>
                    )}

                    {question.fieldType === "linear_scale" && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="number"
                          value={question.scale.min}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) => ({
                              ...current,
                              scale: {
                                ...current.scale,
                                min: Number(event.target.value || 1),
                              },
                            }))
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300"
                          placeholder="Min"
                        />
                        <input
                          type="number"
                          value={question.scale.max}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) => ({
                              ...current,
                              scale: {
                                ...current.scale,
                                max: Number(event.target.value || 5),
                              },
                            }))
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300"
                          placeholder="Max"
                        />
                        <input
                          type="text"
                          value={question.scale.minLabel}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) => ({
                              ...current,
                              scale: {
                                ...current.scale,
                                minLabel: event.target.value,
                              },
                            }))
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300"
                          placeholder="Min label"
                        />
                        <input
                          type="text"
                          value={question.scale.maxLabel}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) => ({
                              ...current,
                              scale: {
                                ...current.scale,
                                maxLabel: event.target.value,
                              },
                            }))
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300"
                          placeholder="Max label"
                        />
                      </div>
                    )}

                    {(question.fieldType === "mc_grid" ||
                      question.fieldType === "checkbox_grid") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <label className="text-sm font-body text-slate-800">
                          Rows (comma separated)
                          <input
                            type="text"
                            value={(question.grid.rows || []).join(", ")}
                            onChange={(event) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                grid: {
                                  ...current.grid,
                                  rows: parseCommaValues(event.target.value),
                                },
                              }))
                            }
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
                          />
                        </label>
                        <label className="text-sm font-body text-slate-800">
                          Columns (comma separated)
                          <input
                            type="text"
                            value={(question.grid.columns || []).join(", ")}
                            onChange={(event) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                grid: {
                                  ...current.grid,
                                  columns: parseCommaValues(event.target.value),
                                },
                              }))
                            }
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
                          />
                        </label>
                      </div>
                    )}

                    {question.fieldType === "file_upload" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <label className="text-sm font-body text-slate-800">
                          Max files
                          <input
                            type="number"
                            min={1}
                            value={question.fileConfig.maxFiles || 1}
                            onChange={(event) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                fileConfig: {
                                  ...current.fileConfig,
                                  maxFiles: Number(event.target.value || 1),
                                },
                              }))
                            }
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
                          />
                        </label>
                        <label className="text-sm font-body text-slate-800">
                          Max size (MB)
                          <input
                            type="number"
                            min={1}
                            value={question.fileConfig.maxSizeMB || 10}
                            onChange={(event) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                fileConfig: {
                                  ...current.fileConfig,
                                  maxSizeMB: Number(event.target.value || 10),
                                },
                              }))
                            }
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
                          />
                        </label>
                        <label className="text-sm font-body text-slate-800">
                          Allowed MIME (comma)
                          <input
                            type="text"
                            value={(question.fileConfig.allowedMimeTypes || []).join(", ")}
                            onChange={(event) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                fileConfig: {
                                  ...current.fileConfig,
                                  allowedMimeTypes: parseCommaValues(event.target.value),
                                },
                              }))
                            }
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
                          />
                        </label>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-sm font-body text-slate-800">
                        <input
                          type="checkbox"
                          checked={question.isRequired}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) => ({
                              ...current,
                              isRequired: event.target.checked,
                            }))
                          }
                        />
                        Wajib diisi
                      </label>

                      <div className="flex items-center gap-2">
                        <select
                          value={question.sectionId}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) => ({
                              ...current,
                              sectionId: event.target.value,
                            }))
                          }
                          className="px-3 py-1 rounded-lg border border-slate-300 text-sm"
                        >
                          {schemaState.sections.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.title}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeQuestion(question.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 text-red-600 text-sm"
                        >
                          <FiTrash2 /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addQuestion(section.id)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-body"
              >
                <FiPlus /> Tambah pertanyaan di section ini
              </button>
            </div>
          );
        })}

        <button
          onClick={addSection}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-body"
        >
          <FiPlus /> Tambah section
        </button>
      </section>

      <section className="bg-white border border-slate-300 rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-body text-slate-700">
          Latest published:
          <span className="font-semibold text-slate-900 ml-1">
            {latestPublished ? `v${latestPublished.version}` : "Belum ada"}
          </span>
        </p>
      </section>
    </div>
  );
}
