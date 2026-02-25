import { prisma } from "@/lib/prisma";
import {
  COLLECT_EMAIL_MODES,
  RESPONSE_POLICIES,
  serializeAnswerForExport,
} from "@/lib/forms/schema";

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function normalizeGridAnswer(value, questionType) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  if (questionType === "mc_grid") {
    const normalized = {};
    for (const [row, selected] of Object.entries(value)) {
      if (typeof row !== "string") continue;
      if (typeof selected === "string" && selected.trim()) {
        normalized[row] = selected.trim();
      }
    }
    return normalized;
  }

  const normalized = {};
  for (const [row, selectedList] of Object.entries(value)) {
    if (!Array.isArray(selectedList)) continue;
    normalized[row] = selectedList
      .filter((entry) => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return normalized;
}

function normalizeAnswerByType(question, rawValue) {
  switch (question.fieldType) {
    case "short_text":
    case "paragraph":
    case "date":
    case "time":
      return typeof rawValue === "string" ? rawValue : "";
    case "single_choice":
    case "dropdown":
      return typeof rawValue === "string" ? rawValue : "";
    case "multi_choice":
      return Array.isArray(rawValue)
        ? rawValue.filter((entry) => typeof entry === "string")
        : [];
    case "linear_scale":
      return Number.isFinite(Number(rawValue)) ? Number(rawValue) : null;
    case "file_upload":
      return Array.isArray(rawValue)
        ? rawValue
            .filter(
              (entry) =>
                entry &&
                typeof entry === "object" &&
                typeof entry.key === "string" &&
                entry.key,
            )
            .map((entry) => ({
              key: entry.key,
              name: typeof entry.name === "string" ? entry.name : entry.key,
              size: Number.isFinite(Number(entry.size)) ? Number(entry.size) : 0,
              type: typeof entry.type === "string" ? entry.type : "",
            }))
        : [];
    case "mc_grid":
    case "checkbox_grid":
      return normalizeGridAnswer(rawValue, question.fieldType);
    default:
      return rawValue;
  }
}

export function validateSubmissionAnswers(schema, rawAnswers = {}) {
  const errors = [];
  const answers =
    rawAnswers && typeof rawAnswers === "object" && !Array.isArray(rawAnswers)
      ? rawAnswers
      : {};

  const normalizedAnswers = {};

  for (const question of schema.questions) {
    const answerKey = question.id || question.key;
    const normalizedValue = normalizeAnswerByType(question, answers[answerKey]);
    normalizedAnswers[answerKey] = normalizedValue;

    if (question.isRequired && !hasValue(normalizedValue)) {
      errors.push(`Question "${question.label}" wajib diisi.`);
      continue;
    }

    if (question.fieldType === "single_choice" || question.fieldType === "dropdown") {
      if (!normalizedValue) continue;
      const optionLabels = new Set(question.options.map((opt) => opt.label));
      if (!optionLabels.has(normalizedValue)) {
        errors.push(`Jawaban untuk "${question.label}" tidak valid.`);
      }
    }

    if (question.fieldType === "multi_choice") {
      const optionLabels = new Set(question.options.map((opt) => opt.label));
      for (const item of normalizedValue) {
        if (!optionLabels.has(item)) {
          errors.push(`Pilihan "${item}" pada "${question.label}" tidak valid.`);
        }
      }
    }

    if (question.fieldType === "linear_scale" && hasValue(normalizedValue)) {
      if (
        normalizedValue < question.scale.min ||
        normalizedValue > question.scale.max
      ) {
        errors.push(`Nilai skala untuk "${question.label}" berada di luar rentang.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    normalizedAnswers,
  };
}

function extractSubmissionEmail(submission) {
  const answers =
    submission?.answers &&
    typeof submission.answers === "object" &&
    !Array.isArray(submission.answers)
      ? submission.answers
      : {};

  const system =
    answers._system && typeof answers._system === "object"
      ? answers._system
      : {};

  return typeof system.respondentEmail === "string"
    ? system.respondentEmail.toLowerCase()
    : null;
}

export async function findExistingSubmissionByIdentity(eventId, identity) {
  if (!identity?.userId && !identity?.email) {
    return null;
  }

  if (identity.userId) {
    return prisma.eventSubmission.findFirst({
      where: {
        eventId,
        submitterUserId: identity.userId,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });
  }

  const eventSubmissions = await prisma.eventSubmission.findMany({
    where: { eventId },
    orderBy: {
      submittedAt: "desc",
    },
  });

  const target = identity.email.toLowerCase();
  return (
    eventSubmissions.find(
      (submission) => extractSubmissionEmail(submission) === target,
    ) ?? null
  );
}

export function buildSubmissionSystemFields({
  schema,
  sessionUser,
  publicEmail,
  consentAccepted,
}) {
  const respondentEmail =
    typeof publicEmail === "string" && publicEmail.trim()
      ? publicEmail.trim().toLowerCase()
      : typeof sessionUser?.email === "string"
        ? sessionUser.email.toLowerCase()
        : "";

  if (
    schema.settings.collectEmailMode === COLLECT_EMAIL_MODES.REQUIRED &&
    !respondentEmail
  ) {
    return {
      valid: false,
      errors: ["Email responden wajib diisi untuk form ini."],
      system: null,
    };
  }

  return {
    valid: true,
    errors: [],
    system: {
      respondentEmail,
      consentAccepted: Boolean(consentAccepted),
      submittedByUserId: sessionUser?.id ?? null,
      submittedByRole: sessionUser?.role ?? null,
    },
  };
}

export function canEditWithPolicy(responsePolicy) {
  return responsePolicy === RESPONSE_POLICIES.SINGLE_WITH_EDIT;
}

export function isSingleResponsePolicy(responsePolicy) {
  return (
    responsePolicy === RESPONSE_POLICIES.SINGLE_NO_EDIT ||
    responsePolicy === RESPONSE_POLICIES.SINGLE_WITH_EDIT
  );
}

export function flattenSubmissionRows({
  submissions,
  requestedFields,
  questions,
  buildFileUrl,
}) {
  const rows = [];

  for (const submission of submissions) {
    const answers =
      submission.answers &&
      typeof submission.answers === "object" &&
      !Array.isArray(submission.answers)
        ? submission.answers
        : {};

    const row = {
      submissionId: submission.id,
      submittedAt: submission.submittedAt,
      updatedAt: submission.updatedAt,
      submitterUserId: submission.submitterUserId ?? "",
      participantProfileId: submission.participantProfileId ?? "",
      respondentEmail:
        typeof answers._system?.respondentEmail === "string"
          ? answers._system.respondentEmail
          : "",
    };

    for (const field of requestedFields) {
      row[`profile.${field.key}`] = serializeAnswerForExport(
        submission.consentedProfileSnapshot?.[field.key],
      );
    }

    for (const question of questions) {
      const answerKey = question.id || question.key;
      const answerValue = answers[answerKey];

      if (question.fieldType === "file_upload" && Array.isArray(answerValue)) {
        const links = answerValue
          .map((entry) => buildFileUrl(entry?.key))
          .filter(Boolean)
          .join(" | ");
        row[`q.${question.label}`] = links;
        continue;
      }

      row[`q.${question.label}`] = serializeAnswerForExport(answerValue);
    }

    rows.push(row);
  }

  return rows;
}
