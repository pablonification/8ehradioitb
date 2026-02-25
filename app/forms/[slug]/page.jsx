"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function normalizeAnswersFromSubmission(submission) {
  if (!submission?.answers || typeof submission.answers !== "object") {
    return {};
  }

  const next = { ...submission.answers };
  delete next._system;
  return next;
}

function sectionQuestionMap(sections, questions) {
  const map = new Map();
  for (const section of sections) {
    map.set(section.id, []);
  }

  for (const question of questions) {
    if (!map.has(question.sectionId)) {
      map.set(question.sectionId, []);
    }
    map.get(question.sectionId).push(question);
  }

  return map;
}

function renderValuePreview(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.map(renderValuePreview).join(", ");
  if (typeof value === "object") {
    if (typeof value.name === "string" && value.name.trim()) return value.name;
    if (typeof value.key === "string" && value.key.trim()) return value.key;
    return JSON.stringify(value);
  }
  return String(value);
}

function extractDownloadEntries(value) {
  if (!value) return [];

  const entries = [];

  if (typeof value === "string") {
    const key = value.trim();
    if (key) {
      entries.push({
        key,
        name: key.split("/").pop() || key,
      });
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      entries.push(...extractDownloadEntries(item));
    }
  } else if (typeof value === "object") {
    const key =
      typeof value.key === "string"
        ? value.key.trim()
        : typeof value.url === "string"
          ? value.url.trim()
          : "";
    if (key) {
      entries.push({
        key,
        name:
          typeof value.name === "string" && value.name.trim()
            ? value.name.trim()
            : key.split("/").pop() || key,
      });
    }
  }

  const unique = new Map();
  for (const entry of entries) {
    if (!unique.has(entry.key)) {
      unique.set(entry.key, entry);
    }
  }

  return Array.from(unique.values());
}

export default function PublicFormPage() {
  const params = useParams();
  const eventSlug = params.slug;
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [respondentEmail, setRespondentEmail] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successPayload, setSuccessPayload] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [downloadingKey, setDownloadingKey] = useState("");

  function formatMissingProfileMessage(payload) {
    const labels = Array.isArray(payload?.missingFieldLabels)
      ? payload.missingFieldLabels.filter((label) => typeof label === "string" && label.trim())
      : [];

    if (labels.length === 0) {
      return "Data master profile Anda belum lengkap. Lengkapi dulu sebelum mengisi form ini.";
    }

    return `Data master profile belum lengkap: ${labels.join(", ")}. Lengkapi dulu sebelum mengisi form ini.`;
  }

  useEffect(() => {
    if (!eventSlug) return;
    void loadForm();
  }, [eventSlug, status]);

  useEffect(() => {
    if (!showConsentModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showConsentModal]);

  const sectionMap = useMemo(() => {
    const sections = formData?.sections || [];
    const questions = formData?.questions || [];
    return sectionQuestionMap(sections, questions);
  }, [formData]);

  const sectionOrder = useMemo(
    () =>
      Array.isArray(formData?.sections)
        ? formData.sections.map((section) => section.id)
        : [],
    [formData],
  );

  const activeSection = useMemo(() => {
    if (!formData?.sections) return null;
    return formData.sections.find((section) => section.id === activeSectionId) || null;
  }, [formData, activeSectionId]);

  const activeQuestions = useMemo(() => {
    if (!activeSectionId) return [];
    return sectionMap.get(activeSectionId) || [];
  }, [sectionMap, activeSectionId]);

  const requestedProfileFields = useMemo(
    () =>
      Array.isArray(formData?.requestedProfileFields)
        ? formData.requestedProfileFields
        : [],
    [formData],
  );

  const isInternalAudience = formData?.settings?.audienceMode === "INTERNAL_KRU";
  const needsConsentGate = isInternalAudience && requestedProfileFields.length > 0;

  const requestedFieldLabelSummary = useMemo(() => {
    if (!requestedProfileFields.length) return "";
    const labels = requestedProfileFields
      .map((field) => field.label || field.key)
      .filter(Boolean);
    const visible = labels.slice(0, 8);
    return `${visible.join(", ")}${labels.length > 8 ? ", dan lainnya" : ""}`;
  }, [requestedProfileFields]);

  async function loadForm() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${eventSlug}/form`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload.error === "login_required") {
          setFormData({
            blockedReason: "login_required",
            message: "Form internal ini wajib login.",
          });
          return;
        }

        if (payload.error === "profile_required" || payload.error === "profile_incomplete") {
          setFormData({
            blockedReason: "profile_required",
            setupUrl: payload.setupUrl || "/profile/setup",
            message:
              payload.error === "profile_incomplete"
                ? formatMissingProfileMessage(payload)
                : "Anda harus melengkapi master profile terlebih dahulu.",
          });
          return;
        }

        if (payload.error === "not_kru") {
          setFormData({
            blockedReason: "not_kru",
            message: "Form ini hanya untuk kru internal.",
          });
          return;
        }

        throw new Error(payload.error || "Failed to load form");
      }

      setFormData(payload);
      setAnswers(normalizeAnswersFromSubmission(payload.existingSubmission));

      const systemEmail =
        typeof payload?.existingSubmission?.answers?._system?.respondentEmail === "string"
          ? payload.existingSubmission.answers._system.respondentEmail
          : "";

      setRespondentEmail(systemEmail || session?.user?.email || "");
      setActiveSectionId(payload.sections?.[0]?.id || "");
      setShowConsentModal(false);
      setShowAccountDetails(false);
      setConsentAccepted(false);
      setConfirmError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  }

  function updateAnswer(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  async function uploadFile(questionId, file) {
    const response = await fetch("/api/forms/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventSlug,
        questionId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Failed to get upload URL");
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

    return {
      key,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  }

  async function handleFileChange(question, fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setError("");

    try {
      const uploaded = [];
      for (const file of files.slice(0, question.fileConfig.maxFiles || 1)) {
        const item = await uploadFile(question.id, file);
        uploaded.push(item);
      }
      updateAnswer(question.id, uploaded);
    } catch (uploadError) {
      setError(uploadError.message || "Failed to upload file");
    }
  }

  async function handleDownloadFile(fileKey, fileName = "") {
    if (!fileKey) return;
    setDownloadingKey(fileKey);
    setError("");

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

  function renderRequestedProfileFieldValue(field) {
    const previewValue = formData?.consentPreviewValues?.[field.key];
    if (field.fieldType !== "file") {
      return (
        <p className="font-body text-sm text-slate-800">
          {renderValuePreview(previewValue)}
        </p>
      );
    }

    const fileEntries = extractDownloadEntries(previewValue);
    if (fileEntries.length === 0) {
      return <p className="font-body text-sm text-slate-800">-</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {fileEntries.map((entry, index) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => void handleDownloadFile(entry.key, entry.name)}
            disabled={downloadingKey === entry.key}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-body text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {downloadingKey === entry.key
              ? "Mempersiapkan..."
              : `Download ${entry.name || `File ${index + 1}`}`}
          </button>
        ))}
      </div>
    );
  }

  function validateCurrentSection() {
    for (const question of activeQuestions) {
      if (!question.isRequired) continue;
      const answerValue = answers[question.id];
      if (!hasValue(answerValue)) {
        return `Pertanyaan wajib belum diisi: ${question.label}`;
      }
    }

    return "";
  }

  function resolveSectionDestination() {
    for (const question of activeQuestions) {
      if (!["single_choice", "dropdown"].includes(question.fieldType)) {
        continue;
      }

      const value = answers[question.id];
      if (!value) continue;

      const option = question.options?.find((item) => item.label === value);
      if (option?.destinationSectionId) {
        return option.destinationSectionId;
      }
    }

    return null;
  }

  async function handleNextOrSubmit() {
    setError("");

    const validationError = validateCurrentSection();
    if (validationError) {
      setError(validationError);
      return;
    }

    const destination = resolveSectionDestination();
    if (destination === "__submit__") {
      await openConfirmOrSubmit();
      return;
    }

    if (destination && sectionOrder.includes(destination)) {
      setActiveSectionId(destination);
      return;
    }

    const currentIndex = sectionOrder.indexOf(activeSectionId);
    if (currentIndex === -1 || currentIndex === sectionOrder.length - 1) {
      await openConfirmOrSubmit();
      return;
    }

    setActiveSectionId(sectionOrder[currentIndex + 1]);
  }

  async function openConfirmOrSubmit() {
    if (needsConsentGate) {
      setConfirmError("");
      setShowConsentModal(true);
      return;
    }

    await submitResponse();
  }

  async function handleConfirmedSubmit() {
    setConfirmError("");

    if (needsConsentGate && !consentAccepted) {
      setConfirmError("Anda harus menyetujui penggunaan data profil sebelum submit.");
      return;
    }

    setShowConsentModal(false);
    await submitResponse();
  }

  async function submitResponse() {
    if (!formData) return;

    if (formData.settings?.collectEmailMode === "required" && !respondentEmail.trim()) {
      setError("Email responden wajib diisi.");
      return;
    }

    if (needsConsentGate && !consentAccepted) {
      setError("Anda harus menyetujui penggunaan data profil sebelum submit.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${eventSlug}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          respondentEmail,
          consentAccepted,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (payload?.error === "login_required") {
          setFormData({
            blockedReason: "login_required",
            message: "Form internal ini wajib login.",
          });
          return;
        }

        if (payload?.error === "profile_required" || payload?.error === "profile_incomplete") {
          setFormData({
            blockedReason: "profile_required",
            setupUrl: payload.setupUrl || "/profile/setup",
            message:
              payload.error === "profile_required"
                ? "Anda harus melengkapi master profile terlebih dahulu."
                : formatMissingProfileMessage(payload),
          });
          return;
        }

        throw new Error(payload?.error || "Failed to submit form");
      }

      setSuccessPayload(payload);
      const redirectUrl = payload?.confirmation?.redirectUrl;
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1800);
      }
    } catch (submitError) {
      setError(submitError.message || "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  }

  const cardClass =
    "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]";
  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100";

  if (loading || status === "loading") {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 font-body text-slate-600 shadow-sm">
          Loading form...
        </div>
      </main>
    );
  }

  if (successPayload) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="font-heading text-3xl font-bold text-slate-900">
            {successPayload?.confirmation?.title || "Respons terkirim"}
          </h1>
          <p className="font-body text-slate-700">
            {successPayload?.confirmation?.message || "Terima kasih sudah mengisi form."}
          </p>
          <Link href="/" className="font-body text-sm font-semibold text-[#ea580c] hover:underline">
            Kembali ke beranda
          </Link>
        </div>
      </main>
    );
  }

  if (formData?.blockedReason === "login_required") {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-slate-900">Login Required</h1>
          <p className="font-body text-slate-700">{formData.message}</p>
          <button
            onClick={() => signIn("google", { callbackUrl: `/forms/${eventSlug}` })}
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white"
          >
            Login dengan Google
          </button>
        </div>
      </main>
    );
  }

  if (formData?.blockedReason === "profile_required") {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-slate-900">Profile Required</h1>
          <p className="font-body text-slate-700">{formData.message}</p>
          <Link
            href={formData.setupUrl || "/profile/setup"}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white"
          >
            Lengkapi Master Profile
          </Link>
        </div>
      </main>
    );
  }

  if (formData?.blockedReason === "not_kru") {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-slate-900">Akses Terbatas</h1>
          <p className="font-body text-slate-700">{formData.message}</p>
        </div>
      </main>
    );
  }

  if (!formData) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 font-body text-red-600 shadow-sm">
          Form tidak ditemukan.
        </div>
      </main>
    );
  }

  if (formData.isClosed) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-slate-900">
            {formData.closedMessage?.title || "Form closed"}
          </h1>
          <p className="font-body text-slate-700">
            {formData.closedMessage?.description || "Form ini sudah ditutup."}
          </p>
        </div>
      </main>
    );
  }

  const currentSectionIndex = sectionOrder.indexOf(activeSectionId);
  const isLastSection = currentSectionIndex === sectionOrder.length - 1;
  const accountName = session?.user?.name || respondentEmail || "Pengisi Form";
  const accountEmail = session?.user?.email || respondentEmail || "-";

  return (
    <>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7ed_0%,#f3efe5_55%,#eee8dc_100%)] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4 pb-8">
          <section className={cardClass}>
            <div className="h-1.5 bg-[#f97316]" />
            <div className="space-y-4 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <Image
                  src="/8eh-real-long.png"
                  alt="8EH Radio ITB"
                  width={140}
                  height={36}
                  className="h-8 w-auto object-contain"
                  priority
                />
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Form
                </span>
              </div>

              <div>
                <h1 className="font-heading text-4xl font-bold leading-tight text-slate-900">
                  {formData.event?.title || "Form"}
                </h1>
                {formData.event?.description ? (
                  <p className="mt-2 whitespace-pre-wrap font-body text-sm text-slate-700">
                    {formData.event.description}
                  </p>
                ) : null}
              </div>

              {session?.user?.email ? (
                <p className="font-body text-sm text-slate-500">
                  Login sebagai <span className="font-semibold text-slate-700">{session.user.email}</span>
                </p>
              ) : null}

              {(formData.settings?.collectEmailMode === "required" ||
                formData.settings?.collectEmailMode === "optional") && (
                <label className="block font-body text-sm font-semibold text-slate-700">
                  Email responden
                  {formData.settings.collectEmailMode === "required" ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                  <input
                    type="email"
                    value={respondentEmail}
                    onChange={(event) => setRespondentEmail(event.target.value)}
                    className={`mt-2 ${inputClass}`}
                    placeholder="nama@email.com"
                    required={formData.settings.collectEmailMode === "required"}
                  />
                </label>
              )}
            </div>
          </section>

          {isInternalAudience && session?.user?.email ? (
            <section className={cardClass}>
              <div className="h-1.5 bg-[#f97316]" />
              <div className="p-6">
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Akun Pengisi
                </p>

                <div className="mt-3 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a66c2] font-body text-sm font-bold text-white">
                      {accountName?.trim()?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-semibold text-slate-900">
                        {accountName}
                      </p>
                      <p className="truncate font-body text-xs text-slate-500">{accountEmail}</p>
                      {requestedFieldLabelSummary ? (
                        <p className="mt-1 font-body text-xs leading-relaxed text-slate-500">
                          {requestedFieldLabelSummary} akan direkam saat formulir ini dikirimkan.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {needsConsentGate ? (
                    <button
                      type="button"
                      onClick={() => setShowAccountDetails((prev) => !prev)}
                      className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 font-body text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      {showAccountDetails ? "Sembunyikan" : "Tampilkan"}
                    </button>
                  ) : null}
                </div>

                {showAccountDetails && needsConsentGate ? (
                  <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {requestedProfileFields.map((field) => (
                      <div
                        key={field.key}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {field.label || field.key}
                        </p>
                        {renderRequestedProfileFieldValue(field)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {activeSection ? (
            <section className={cardClass}>
              <div className="h-1.5 bg-[#f97316]" />
              <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bagian {currentSectionIndex + 1} / {sectionOrder.length}
                  </p>
                  <h2 className="font-heading text-4xl font-bold leading-tight text-slate-900">
                    {activeSection.title}
                  </h2>
                  {activeSection.description ? (
                    <p className="mt-2 font-body text-sm text-slate-700">
                      {activeSection.description}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {activeQuestions.map((question) => {
                    const value = answers[question.id];

                    return (
                      <div key={question.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                        <label className="block font-body text-sm font-semibold text-slate-800">
                          {question.label}
                          {question.isRequired ? <span className="text-red-500"> *</span> : null}
                        </label>

                        {question.description ? (
                          <p className="font-body text-xs text-slate-500">{question.description}</p>
                        ) : null}

                        {question.fieldType === "short_text" && (
                          <input
                            type="text"
                            value={typeof value === "string" ? value : ""}
                            onChange={(event) => updateAnswer(question.id, event.target.value)}
                            className={inputClass}
                            placeholder={question.description || "Tulis jawaban Anda"}
                          />
                        )}

                        {question.fieldType === "paragraph" && (
                          <textarea
                            value={typeof value === "string" ? value : ""}
                            onChange={(event) => updateAnswer(question.id, event.target.value)}
                            className={`${inputClass} min-h-28`}
                            placeholder={question.description || "Tulis jawaban Anda"}
                          />
                        )}

                        {(question.fieldType === "single_choice" ||
                          question.fieldType === "dropdown") && (
                          <div className="space-y-2">
                            {question.fieldType === "single_choice" ? (
                              <div className="space-y-2">
                                {question.options.map((option) => (
                                  <label
                                    key={option.id}
                                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 font-body text-sm text-slate-700"
                                  >
                                    <input
                                      type="radio"
                                      name={question.id}
                                      checked={value === option.label}
                                      onChange={() => updateAnswer(question.id, option.label)}
                                      className="h-4 w-4 accent-[#f97316]"
                                    />
                                    {option.label}
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <select
                                value={typeof value === "string" ? value : ""}
                                onChange={(event) => updateAnswer(question.id, event.target.value)}
                                className={inputClass}
                              >
                                <option value="">Pilih opsi</option>
                                {question.options.map((option) => (
                                  <option key={option.id} value={option.label}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}

                        {question.fieldType === "multi_choice" && (
                          <div className="space-y-2">
                            {question.options.map((option) => {
                              const checked = Array.isArray(value)
                                ? value.includes(option.label)
                                : false;
                              return (
                                <label
                                  key={option.id}
                                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 font-body text-sm text-slate-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    className="h-4 w-4 accent-[#f97316]"
                                    onChange={(event) => {
                                      const next = Array.isArray(value) ? [...value] : [];
                                      if (event.target.checked) {
                                        if (!next.includes(option.label)) {
                                          next.push(option.label);
                                        }
                                      } else {
                                        const index = next.indexOf(option.label);
                                        if (index >= 0) next.splice(index, 1);
                                      }
                                      updateAnswer(question.id, next);
                                    }}
                                  />
                                  {option.label}
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {question.fieldType === "linear_scale" && (
                          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            {Array.from(
                              {
                                length:
                                  (question.scale?.max || 5) -
                                  (question.scale?.min || 1) +
                                  1,
                              },
                              (_, index) => (question.scale?.min || 1) + index,
                            ).map((score) => (
                              <label
                                key={score}
                                className="inline-flex flex-col items-center gap-1 font-body text-xs text-slate-600"
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  checked={Number(value) === score}
                                  onChange={() => updateAnswer(question.id, score)}
                                  className="h-4 w-4 accent-[#f97316]"
                                />
                                {score}
                              </label>
                            ))}
                          </div>
                        )}

                        {(question.fieldType === "date" || question.fieldType === "time") && (
                          <input
                            type={question.fieldType === "date" ? "date" : "time"}
                            value={typeof value === "string" ? value : ""}
                            onChange={(event) => updateAnswer(question.id, event.target.value)}
                            className={`${inputClass} max-w-xs`}
                          />
                        )}

                        {(question.fieldType === "mc_grid" ||
                          question.fieldType === "checkbox_grid") && (
                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="min-w-full text-sm">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-3 py-2 text-left font-body text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Row
                                  </th>
                                  {(question.grid?.columns || []).map((column) => (
                                    <th
                                      key={column}
                                      className="px-3 py-2 text-center font-body text-xs font-semibold uppercase tracking-wide text-slate-500"
                                    >
                                      {column}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(question.grid?.rows || []).map((row) => {
                                  const rowValue =
                                    value && typeof value === "object"
                                      ? value[row]
                                      : undefined;
                                  return (
                                    <tr key={row} className="border-t border-slate-100">
                                      <td className="px-3 py-2 font-body text-sm text-slate-700">
                                        {row}
                                      </td>
                                      {(question.grid?.columns || []).map((column) => {
                                        const checked =
                                          question.fieldType === "mc_grid"
                                            ? rowValue === column
                                            : Array.isArray(rowValue)
                                              ? rowValue.includes(column)
                                              : false;

                                        return (
                                          <td key={column} className="px-3 py-2 text-center">
                                            <input
                                              type={
                                                question.fieldType === "mc_grid"
                                                  ? "radio"
                                                  : "checkbox"
                                              }
                                              name={`${question.id}_${row}`}
                                              checked={checked}
                                              className="h-4 w-4 accent-[#f97316]"
                                              onChange={(event) => {
                                                const next =
                                                  value &&
                                                  typeof value === "object" &&
                                                  !Array.isArray(value)
                                                    ? { ...value }
                                                    : {};

                                                if (question.fieldType === "mc_grid") {
                                                  next[row] = column;
                                                } else {
                                                  const current = Array.isArray(next[row])
                                                    ? [...next[row]]
                                                    : [];
                                                  if (event.target.checked) {
                                                    if (!current.includes(column)) {
                                                      current.push(column);
                                                    }
                                                  } else {
                                                    const index = current.indexOf(column);
                                                    if (index >= 0) current.splice(index, 1);
                                                  }
                                                  next[row] = current;
                                                }

                                                updateAnswer(question.id, next);
                                              }}
                                            />
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

                        {question.fieldType === "file_upload" && (
                          <div className="space-y-2">
                            <input
                              type="file"
                              multiple={(question.fileConfig?.maxFiles || 1) > 1}
                              onChange={(event) =>
                                handleFileChange(question, event.target.files)
                              }
                              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                            />
                            {Array.isArray(value) && value.length > 0 ? (
                              <ul className="space-y-1 text-xs font-body text-slate-600">
                                {value.map((item) => (
                                  <li key={item.key}>{item.name || item.key}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {error ? (
            <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
              {error}
            </section>
          ) : null}

          <section className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                const currentIndex = sectionOrder.indexOf(activeSectionId);
                if (currentIndex > 0) {
                  setActiveSectionId(sectionOrder[currentIndex - 1]);
                }
              }}
              disabled={sectionOrder.indexOf(activeSectionId) <= 0}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-body text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Kembali
            </button>

            <div className="flex items-center gap-3">
              {isLastSection ? (
                <p className="hidden font-body text-xs text-slate-500 sm:block">
                  Setelah klik submit, Anda akan melihat konfirmasi akhir terlebih dahulu.
                </p>
              ) : null}
              <button
                onClick={handleNextOrSubmit}
                disabled={submitting}
                className="rounded-lg bg-[#f97316] px-5 py-2 font-body text-sm font-semibold text-white transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Mengirim..." : isLastSection ? "Submit" : "Berikutnya"}
              </button>
            </div>
          </section>
        </div>
      </main>

      {showConsentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="h-1.5 bg-[#f97316]" />

            <div className="space-y-5 p-6 sm:p-8">
              <div>
                <h3 className="font-heading text-4xl font-bold leading-tight text-slate-900">
                  Konfirmasi Sebelum Submit
                </h3>
                <p className="mt-1 font-body text-sm text-slate-600">
                  Data diri berikut akan dilihat pembuat form jika Anda lanjut submit.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Data Profil Terpusat
                </p>

                <div className="mt-3 max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                  {requestedProfileFields.map((field) => (
                    <div key={field.key} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {field.label || field.key}
                      </p>
                      {renderRequestedProfileFieldValue(field)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 bg-white px-6 py-4 sm:px-8">
              <label className="inline-flex items-start gap-2 font-body text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(event) => setConsentAccepted(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#f97316]"
                />
                Saya setuju data di atas dikirim bersama respons ini.
              </label>

              {confirmError ? (
                <p className="font-body text-sm text-red-600">{confirmError}</p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConsentModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-body text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmedSubmit}
                  disabled={submitting}
                  className="rounded-lg bg-[#f97316] px-5 py-2 font-body text-sm font-semibold text-white transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Mengirim..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
