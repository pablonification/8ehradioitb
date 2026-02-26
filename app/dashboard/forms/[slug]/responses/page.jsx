"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FiDownload, FiEdit2, FiRefreshCw, FiSearch } from "react-icons/fi";

const OPTION_LIKE_TYPES = new Set([
  "single_choice",
  "dropdown",
  "linear_scale",
  "rating",
  "radio",
  "select",
]);

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
    if (value.every((item) => item && typeof item === "object" && typeof item.name === "string")) {
      return value
        .map((item) => item.name || item.key)
        .filter(Boolean)
        .join(", ");
    }
    return value.map((item) => stringifyAnswer(item)).filter(Boolean).join(", ");
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
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return "";
  const respondentEmail = answers?._system?.respondentEmail;
  return typeof respondentEmail === "string" ? respondentEmail.trim() : "";
}

function normalizeProfileEntries(snapshot, requestedProfileKeys = []) {
  if (Array.isArray(snapshot?.fields)) {
    return snapshot.fields
      .filter((field) => field && typeof field === "object" && !Array.isArray(field))
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
    typeof item?.submitterUser?.name === "string" && item.submitterUser.name.trim()
      ? item.submitterUser.name.trim()
      : "";

  const email =
    typeof item?.submitterUser?.email === "string" && item.submitterUser.email.trim()
      ? item.submitterUser.email.trim()
      : respondentEmail;

  return {
    name: name || (email ? "User" : "Anonymous"),
    email,
  };
}

function inputClassName() {
  return "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 font-body text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-100";
}

export default function FormResponsesPage() {
  const params = useParams();
  const eventSlug = params.slug;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ total: 0, items: [] });
  const [responsesTab, setResponsesTab] = useState("summary");
  const [responsesQuery, setResponsesQuery] = useState("");
  const [responseQuestionKey, setResponseQuestionKey] = useState("");
  const [individualSubmissionId, setIndividualSubmissionId] = useState("");
  const [downloadingKey, setDownloadingKey] = useState("");

  useEffect(() => {
    if (!eventSlug) return;
    void loadResponses();
  }, [eventSlug]);

  async function loadResponses() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${eventSlug}/submissions`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to fetch responses");
      }

      const payload = await response.json();
      setData({
        total: Number(payload.total || 0),
        items: Array.isArray(payload.items) ? payload.items : [],
      });
    } catch (loadError) {
      setError(loadError.message || "Failed to fetch responses");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setError("");

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
      setError(exportError.message || "Failed to export XLSX");
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
        throw new Error(payload?.error || "Failed to build download URL");
      }

      const payload = await response.json();
      if (!payload.downloadUrl) {
        throw new Error("Download URL is empty");
      }

      window.open(payload.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(downloadError.message || "Failed to download file");
    } finally {
      setDownloadingKey("");
    }
  }

  const normalizedSubmissions = useMemo(() => {
    return data.items.map((item) => {
      const answers =
        item?.answers && typeof item.answers === "object" && !Array.isArray(item.answers)
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

      const requestedProfileKeys = Array.isArray(item?.formSchemaSnapshot?.requestedProfileFields)
        ? item.formSchemaSnapshot.requestedProfileFields
        : [];

      return {
        ...item,
        submitter,
        respondentEmail,
        questionMetaByKey,
        answersWithoutSystem,
        profileEntries: normalizeProfileEntries(item?.consentedProfileSnapshot, requestedProfileKeys),
      };
    });
  }, [data.items]);

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

  const profileFieldSummaries = useMemo(() => {
    const countsByKey = new Map();

    for (const submission of normalizedSubmissions) {
      for (const field of submission.profileEntries) {
        if (!countsByKey.has(field.key)) {
          countsByKey.set(field.key, {
            key: field.key,
            label: field.label || field.key,
            count: 0,
          });
        }

        if (hasValue(field.value)) {
          const current = countsByKey.get(field.key);
          current.count += 1;
        }
      }
    }

    return Array.from(countsByKey.values());
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
        .flatMap((field) => [field.label || field.key, stringifyAnswer(field.value)])
        .map((entry) => String(entry || "").toLowerCase());

      return [...baseTexts, ...answerTexts, ...profileTexts].some((text) =>
        text.includes(query),
      );
    });
  }, [normalizedSubmissions, responsesQuery]);

  const selectedQuestion = useMemo(() => {
    return responseQuestions.find((question) => question.key === responseQuestionKey) || null;
  }, [responseQuestions, responseQuestionKey]);

  const selectedIndividualSubmission = useMemo(() => {
    return (
      filteredSubmissions.find((submission) => submission.id === individualSubmissionId) ||
      null
    );
  }, [filteredSubmissions, individualSubmissionId]);

  useEffect(() => {
    if (!responseQuestions.length) {
      setResponseQuestionKey("");
      return;
    }

    if (!responseQuestionKey || !responseQuestions.some((question) => question.key === responseQuestionKey)) {
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
      !filteredSubmissions.some((submission) => submission.id === individualSubmissionId)
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

      if (selectedQuestion.fieldType === "multi_choice" && Array.isArray(value)) {
        for (const option of value) {
          const key = String(option);
          counts.set(key, (counts.get(key) || 0) + 1);
        }
        continue;
      }

      if (OPTION_LIKE_TYPES.has(selectedQuestion.fieldType)) {
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

  function renderFileButtonsFromValue(value) {
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
            className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
          >
            {downloadingKey === entry.key
              ? "Preparing..."
              : `Download ${entry.name || `File ${index + 1}`}`}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-stone-900">
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="h-1.5 bg-[#f97316]" />
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-3xl font-bold text-stone-900">
                Responses: {eventSlug}
              </h1>
              <p className="mt-1 font-body text-sm text-stone-500">
                Total response: <span className="font-semibold">{data.total}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/forms/${eventSlug}/builder`}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 font-body text-sm text-stone-700"
              >
                <FiEdit2 /> Back to Builder
              </Link>

              <button
                onClick={() => void loadResponses()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 font-body text-sm font-semibold text-stone-700 disabled:opacity-60"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
              </button>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2 font-body text-sm text-white"
              >
                <FiDownload /> Export XLSX
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-stone-200">
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
                  className={`px-4 py-2.5 font-body text-sm font-semibold transition ${
                    active
                      ? "border-b-2 border-[#f97316] text-[#c2410c]"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative max-w-md">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={responsesQuery}
              onChange={(event) => setResponsesQuery(event.target.value)}
              placeholder="Cari submitter, jawaban, atau data profil"
              className={`${inputClassName()} pl-10`}
            />
          </div>

          {error ? <p className="font-body text-sm text-red-600">{error}</p> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-6 font-body text-stone-500">Loading responses...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-6 font-body text-stone-500">Belum ada response.</div>
        ) : (
          <div className="p-6">
            {responsesTab === "summary" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="font-body text-sm font-semibold text-stone-800">Siapa yang sudah menjawab?</p>
                  <div className="mt-3 grid gap-2">
                    {filteredSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="rounded-lg border border-stone-200 bg-white px-3 py-2"
                      >
                        <p className="font-body text-sm font-semibold text-stone-900">
                          {submission.submitter.name}
                        </p>
                        <p className="font-body text-xs text-stone-500">
                          {submission.submitter.email || "-"}
                        </p>
                        <p className="mt-1 font-body text-xs text-stone-500">
                          {submission.submittedAt
                            ? new Date(submission.submittedAt).toLocaleString("id-ID")
                            : "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="font-body text-sm font-semibold text-stone-800">Statistik per pertanyaan</p>
                  <div className="mt-3 space-y-2">
                    {responseQuestions.map((question) => {
                      const answeredCount = filteredSubmissions.filter((submission) =>
                        hasValue(submission.answersWithoutSystem[question.key]),
                      ).length;

                      return (
                        <div
                          key={question.key}
                          className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
                        >
                          <span className="font-body text-sm text-stone-700">{question.label}</span>
                          <span className="font-body text-xs font-semibold text-stone-500">
                            {answeredCount} jawaban
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {profileFieldSummaries.length > 0 ? (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="font-body text-sm font-semibold text-stone-800">Data profil yang direkam</p>
                    <div className="mt-3 space-y-2">
                      {profileFieldSummaries.map((field) => (
                        <div
                          key={field.key}
                          className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
                        >
                          <span className="font-body text-sm text-stone-700">{field.label}</span>
                          <span className="font-body text-xs font-semibold text-stone-500">
                            {field.count} rekaman
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {responsesTab === "question" ? (
              <div className="space-y-4">
                <div className="max-w-lg">
                  <label className="mb-1 block font-body text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Pilih pertanyaan
                  </label>
                  <select
                    value={responseQuestionKey}
                    onChange={(event) => setResponseQuestionKey(event.target.value)}
                    className={inputClassName()}
                  >
                    {responseQuestions.map((question) => (
                      <option key={question.key} value={question.key}>
                        {question.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-body text-xs text-stone-600">
                  Total respons untuk pertanyaan ini:{" "}
                  <span className="font-semibold text-stone-800">
                    {selectedQuestionResponses.answeredSubmissionCount}
                  </span>
                </div>

                {selectedQuestionResponses.fileAnswers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedQuestionResponses.fileAnswers.map((entry) => (
                      <div
                        key={entry.submissionId}
                        className="rounded-lg border border-stone-200 bg-stone-50 p-3"
                      >
                        <p className="mb-2 font-body text-xs text-stone-500">{entry.submitter}</p>
                        <div className="flex flex-wrap gap-2">
                          {entry.files.map((file, index) => (
                            <button
                              key={`${entry.submissionId}-${file.key}-${index}`}
                              type="button"
                              onClick={() => void handleDownloadFile(file.key, file.name)}
                              disabled={downloadingKey === file.key}
                              className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-60"
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
                ) : selectedQuestionResponses.counts.size > 0 ? (
                  <div className="space-y-2">
                    {Array.from(selectedQuestionResponses.counts.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([option, count]) => {
                        const maxCount = Math.max(
                          ...Array.from(selectedQuestionResponses.counts.values()),
                        );
                        const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;

                        return (
                          <div
                            key={option}
                            className="rounded-lg border border-stone-200 bg-stone-50 p-3"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="font-body text-sm text-stone-700">{option}</span>
                              <span className="font-body text-sm font-semibold text-stone-600">
                                {count}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-stone-200">
                              <div
                                className="h-2 rounded-full bg-[#f97316]"
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : selectedQuestionResponses.textAnswers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedQuestionResponses.textAnswers.map((entry) => (
                      <div
                        key={entry.submissionId}
                        className="rounded-lg border border-stone-200 bg-stone-50 p-3"
                      >
                        <p className="font-body text-sm text-stone-900">{entry.value}</p>
                        <p className="mt-1 font-body text-xs text-stone-500">{entry.submitter}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center font-body text-sm text-stone-500">
                    Belum ada jawaban untuk pertanyaan ini.
                  </div>
                )}
              </div>
            ) : null}

            {responsesTab === "individual" ? (
              <div className="space-y-4">
                <div className="max-w-lg">
                  <label className="mb-1 block font-body text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Pilih responden
                  </label>
                  <select
                    value={individualSubmissionId}
                    onChange={(event) => setIndividualSubmissionId(event.target.value)}
                    className={inputClassName()}
                  >
                    {filteredSubmissions.map((submission) => (
                      <option key={submission.id} value={submission.id}>
                        {submission.submitter.email || submission.submitter.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedIndividualSubmission ? (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="font-body text-sm font-semibold text-stone-900">
                      {selectedIndividualSubmission.submitter.name}
                    </p>
                    <p className="font-body text-xs text-stone-500">
                      {selectedIndividualSubmission.submitter.email || "-"} ·{" "}
                      {selectedIndividualSubmission.submittedAt
                        ? new Date(selectedIndividualSubmission.submittedAt).toLocaleString("id-ID")
                        : "-"}
                    </p>

                    {selectedIndividualSubmission.profileEntries.length > 0 ? (
                      <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3">
                        <p className="font-body text-xs font-semibold uppercase tracking-wide text-stone-500">
                          Data Profil Direkam
                        </p>
                        <div className="mt-2 space-y-2">
                          {selectedIndividualSubmission.profileEntries.map((field) => (
                            (() => {
                              const profileFileEntries = extractFileEntries(field.value);
                              return (
                                <div
                                  key={`profile-${field.key}`}
                                  className="rounded-lg border border-stone-100 bg-stone-50 p-2.5"
                                >
                                  <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                                    {field.label || field.key}
                                  </p>
                                  <div className="mt-1 font-body text-sm text-stone-900">
                                    {profileFileEntries.length > 0
                                      ? renderFileButtonsFromValue(field.value)
                                      : stringifyAnswer(field.value) || "-"}
                                  </div>
                                </div>
                              );
                            })()
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-2">
                      {responseQuestions.map((question) => {
                        const value = selectedIndividualSubmission.answersWithoutSystem[question.key];
                        const fileEntries =
                          question.fieldType === "file_upload"
                            ? extractFileEntries(value)
                            : [];

                        return (
                          <div
                            key={question.key}
                            className="rounded-lg border border-stone-200 bg-white p-3"
                          >
                            <p className="font-body text-xs font-semibold uppercase tracking-wide text-stone-500">
                              {question.label}
                            </p>
                            <div className="mt-1 font-body text-sm text-stone-900">
                              {fileEntries.length > 0
                                ? renderFileButtonsFromValue(value)
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
