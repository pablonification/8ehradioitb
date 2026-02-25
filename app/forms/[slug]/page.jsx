"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

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

function renderQuestionAnswerPreview(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(renderQuestionAnswerPreview).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
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

  useEffect(() => {
    if (!eventSlug) return;
    void loadForm();
  }, [eventSlug, status]);

  const sectionMap = useMemo(() => {
    const sections = formData?.sections || [];
    const questions = formData?.questions || [];
    return sectionQuestionMap(sections, questions);
  }, [formData]);

  const sectionOrder = useMemo(
    () => (Array.isArray(formData?.sections) ? formData.sections.map((section) => section.id) : []),
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

        if (payload.error === "profile_required") {
          setFormData({
            blockedReason: "profile_required",
            setupUrl: payload.setupUrl || "/profile/setup",
            message: "Anda harus melengkapi master profile terlebih dahulu.",
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
      await submitResponse();
      return;
    }

    if (destination && sectionOrder.includes(destination)) {
      setActiveSectionId(destination);
      return;
    }

    const currentIndex = sectionOrder.indexOf(activeSectionId);
    if (currentIndex === -1 || currentIndex === sectionOrder.length - 1) {
      await submitResponse();
      return;
    }

    setActiveSectionId(sectionOrder[currentIndex + 1]);
  }

  async function submitResponse() {
    if (!formData) return;

    if (formData.settings?.collectEmailMode === "required" && !respondentEmail.trim()) {
      setError("Email responden wajib diisi.");
      return;
    }

    if (
      formData.settings?.audienceMode === "INTERNAL_KRU" &&
      (formData.requestedProfileFields || []).length > 0 &&
      !consentAccepted
    ) {
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
                : "Data profile Anda belum lengkap untuk form ini.",
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

  if (loading || status === "loading") {
    return (
      <main className="min-h-screen bg-[#f4f1ea] px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 font-body text-gray-500">
          Loading form...
        </div>
      </main>
    );
  }

  if (successPayload) {
    return (
      <main className="min-h-screen bg-[#f4f1ea] px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-8 space-y-3">
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            {successPayload?.confirmation?.title || "Respons terkirim"}
          </h1>
          <p className="font-body text-gray-600">
            {successPayload?.confirmation?.message || "Terima kasih sudah mengisi form."}
          </p>
          <Link href="/" className="font-body text-sm text-red-600 underline">
            Kembali ke beranda
          </Link>
        </div>
      </main>
    );
  }

  if (formData?.blockedReason === "login_required") {
    return (
      <main className="min-h-screen bg-[#f4f1ea] px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-8 space-y-3">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Login Required</h1>
          <p className="font-body text-gray-600">{formData.message}</p>
          <button
            onClick={() => signIn("google", { callbackUrl: `/forms/${eventSlug}` })}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white font-body"
          >
            Login dengan Google
          </button>
        </div>
      </main>
    );
  }

  if (formData?.blockedReason === "profile_required") {
    return (
      <main className="min-h-screen bg-[#f4f1ea] px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-8 space-y-3">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Profile Required</h1>
          <p className="font-body text-gray-600">{formData.message}</p>
          <Link
            href={formData.setupUrl || "/profile/setup"}
            className="inline-flex px-4 py-2 rounded-lg bg-gray-900 text-white font-body"
          >
            Lengkapi Master Profile
          </Link>
        </div>
      </main>
    );
  }

  if (formData?.blockedReason === "not_kru") {
    return (
      <main className="min-h-screen bg-[#f4f1ea] px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-8 space-y-3">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Akses Terbatas</h1>
          <p className="font-body text-gray-600">{formData.message}</p>
        </div>
      </main>
    );
  }

  if (!formData) {
    return (
      <main className="min-h-screen bg-[#f4f1ea] px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-8 font-body text-red-600">
          Form tidak ditemukan.
        </div>
      </main>
    );
  }

  if (formData.isClosed) {
    return (
      <main className="min-h-screen bg-[#f4f1ea] px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-8 space-y-3">
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            {formData.closedMessage?.title || "Form closed"}
          </h1>
          <p className="font-body text-gray-600">
            {formData.closedMessage?.description || "Form ini sudah ditutup."}
          </p>
        </div>
      </main>
    );
  }

  const currentSectionIndex = sectionOrder.indexOf(activeSectionId);
  const isLastSection = currentSectionIndex === sectionOrder.length - 1;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fdf8ee_0%,#f2f0ea_60%,#ece8df_100%)] px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <section className="bg-white border border-[#f59d2a] border-t-8 rounded-xl p-6 shadow-sm">
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            {formData.event?.title || "Form"}
          </h1>
          {formData.event?.description ? (
            <p className="font-body text-gray-700 mt-3 whitespace-pre-wrap">
              {formData.event.description}
            </p>
          ) : null}

          {session?.user?.email ? (
            <p className="font-body text-sm text-gray-500 mt-4">
              Login sebagai <span className="font-semibold">{session.user.email}</span>
            </p>
          ) : null}

          {(formData.settings?.collectEmailMode === "required" ||
            formData.settings?.collectEmailMode === "optional") && (
            <div className="mt-4">
              <label className="font-body text-sm text-gray-700">
                Email responden
                {formData.settings.collectEmailMode === "required" ? (
                  <span className="text-red-500"> *</span>
                ) : null}
                <input
                  type="email"
                  value={respondentEmail}
                  onChange={(event) => setRespondentEmail(event.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300"
                  placeholder="nama@email.com"
                  required={formData.settings.collectEmailMode === "required"}
                />
              </label>
            </div>
          )}
        </section>

        {activeSection ? (
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="mb-5">
              <p className="font-body text-xs text-gray-500 uppercase tracking-wide">
                Bagian {currentSectionIndex + 1} / {sectionOrder.length}
              </p>
              <h2 className="font-heading text-2xl font-bold text-gray-900">
                {activeSection.title}
              </h2>
              {activeSection.description ? (
                <p className="font-body text-gray-600 mt-1">{activeSection.description}</p>
              ) : null}
            </div>

            <div className="space-y-6">
              {activeQuestions.map((question) => {
                const value = answers[question.id];

                return (
                  <div key={question.id} className="space-y-2">
                    <label className="font-body text-sm text-gray-800 font-semibold block">
                      {question.label}
                      {question.isRequired ? <span className="text-red-500"> *</span> : null}
                    </label>

                    {question.description ? (
                      <p className="font-body text-xs text-gray-500">{question.description}</p>
                    ) : null}

                    {question.fieldType === "short_text" && (
                      <input
                        type="text"
                        value={typeof value === "string" ? value : ""}
                        onChange={(event) => updateAnswer(question.id, event.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300"
                      />
                    )}

                    {question.fieldType === "paragraph" && (
                      <textarea
                        value={typeof value === "string" ? value : ""}
                        onChange={(event) => updateAnswer(question.id, event.target.value)}
                        className="w-full min-h-24 px-3 py-2 rounded-lg border border-gray-300"
                      />
                    )}

                    {(question.fieldType === "single_choice" ||
                      question.fieldType === "dropdown") && (
                      <div className="space-y-2">
                        {question.fieldType === "single_choice" ? (
                          question.options.map((option) => (
                            <label key={option.id} className="inline-flex items-center gap-2 mr-4 font-body text-sm">
                              <input
                                type="radio"
                                name={question.id}
                                checked={value === option.label}
                                onChange={() => updateAnswer(question.id, option.label)}
                              />
                              {option.label}
                            </label>
                          ))
                        ) : (
                          <select
                            value={typeof value === "string" ? value : ""}
                            onChange={(event) => updateAnswer(question.id, event.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300"
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
                      <div className="space-y-1">
                        {question.options.map((option) => {
                          const checked = Array.isArray(value)
                            ? value.includes(option.label)
                            : false;
                          return (
                            <label key={option.id} className="inline-flex items-center gap-2 mr-4 font-body text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
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
                      <div className="flex flex-wrap items-center gap-2">
                        {Array.from(
                          { length: (question.scale?.max || 5) - (question.scale?.min || 1) + 1 },
                          (_, index) => (question.scale?.min || 1) + index,
                        ).map((score) => (
                          <label key={score} className="inline-flex flex-col items-center text-xs font-body text-gray-600">
                            <input
                              type="radio"
                              name={question.id}
                              checked={Number(value) === score}
                              onChange={() => updateAnswer(question.id, score)}
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
                        className="px-3 py-2 rounded-lg border border-gray-300"
                      />
                    )}

                    {(question.fieldType === "mc_grid" ||
                      question.fieldType === "checkbox_grid") && (
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-3 py-2 font-body">Row</th>
                              {(question.grid?.columns || []).map((column) => (
                                <th key={column} className="px-3 py-2 font-body text-center">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(question.grid?.rows || []).map((row) => {
                              const rowValue =
                                value && typeof value === "object" ? value[row] : undefined;
                              return (
                                <tr key={row} className="border-t border-gray-100">
                                  <td className="px-3 py-2 font-body">{row}</td>
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
                                          type={question.fieldType === "mc_grid" ? "radio" : "checkbox"}
                                          name={`${question.id}_${row}`}
                                          checked={checked}
                                          onChange={(event) => {
                                            const next =
                                              value && typeof value === "object" && !Array.isArray(value)
                                                ? { ...value }
                                                : {};

                                            if (question.fieldType === "mc_grid") {
                                              next[row] = column;
                                            } else {
                                              const current = Array.isArray(next[row]) ? [...next[row]] : [];
                                              if (event.target.checked) {
                                                if (!current.includes(column)) current.push(column);
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
                        />
                        {Array.isArray(value) && value.length > 0 ? (
                          <ul className="text-xs font-body text-gray-500 space-y-1">
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
          </section>
        ) : null}

        {formData.settings?.audienceMode === "INTERNAL_KRU" &&
        Array.isArray(formData.requestedProfileFields) &&
        formData.requestedProfileFields.length > 0 ? (
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-2">
            <h3 className="font-heading text-xl font-semibold text-gray-900">
              Data Kru yang Akan Dikirim
            </h3>
            <p className="font-body text-sm text-gray-600">{formData.consentText}</p>
            <ul className="space-y-1 text-sm font-body text-gray-700">
              {formData.requestedProfileFields.map((field) => (
                <li key={field.key}>
                  <span className="font-semibold">{field.label}:</span>{" "}
                  {renderQuestionAnswerPreview(
                    formData.consentPreviewValues?.[field.key],
                  ) || "(akan diambil dari master profile)"}
                </li>
              ))}
            </ul>
            <label className="inline-flex items-center gap-2 font-body text-sm text-gray-700">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(event) => setConsentAccepted(event.target.checked)}
              />
              Saya setuju data di atas dikirim bersama respons ini.
            </label>
          </section>
        ) : null}

        {error ? (
          <section className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-body text-red-700">
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
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-body disabled:opacity-50"
          >
            Kembali
          </button>

          <button
            onClick={handleNextOrSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#f59d2a] text-white text-sm font-body font-semibold disabled:opacity-60"
          >
            {submitting
              ? "Mengirim..."
              : isLastSection
                ? "Kirim"
                : "Berikutnya"}
          </button>
        </section>
      </div>
    </main>
  );
}
