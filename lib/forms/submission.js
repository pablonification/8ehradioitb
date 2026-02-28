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

function normalizeIdentityEmail(email) {
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

function toObjectIdFilter(id) {
  if (typeof id !== "string" || !id.trim()) return null;
  return { $oid: id };
}

async function findExistingSubmissionByEmail(eventId, email) {
  const normalizedEmail = normalizeIdentityEmail(email);
  if (!normalizedEmail) return null;

  // Fast path for newly stored submissions.
  const byIndexedField = await prisma.eventSubmission.findFirst({
    where: {
      eventId,
      respondentEmail: normalizedEmail,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  if (byIndexedField) {
    return byIndexedField;
  }

  // Backward-compatible fallback for older rows that only stored email in JSON answers.
  const eventObjectId = toObjectIdFilter(eventId);
  if (!eventObjectId) return null;

  const legacyMatch = await prisma.eventSubmission.findRaw({
    filter: {
      eventId: eventObjectId,
      "answers._system.respondentEmail": normalizedEmail,
    },
    options: {
      sort: { submittedAt: -1 },
      limit: 1,
    },
  });

  const firstRaw = Array.isArray(legacyMatch) ? legacyMatch[0] : null;
  const legacyId =
    firstRaw && typeof firstRaw === "object" && firstRaw._id
      ? typeof firstRaw._id === "object"
        ? firstRaw._id.$oid
        : firstRaw._id
      : null;

  if (!legacyId || typeof legacyId !== "string") {
    return null;
  }

  return prisma.eventSubmission.findUnique({
    where: { id: legacyId },
  });
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

  return findExistingSubmissionByEmail(eventId, identity.email);
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
  return (
    responsePolicy === RESPONSE_POLICIES.SINGLE_WITH_EDIT ||
    responsePolicy === RESPONSE_POLICIES.MULTIPLE_WITH_EDIT
  );
}

export function isSingleResponsePolicy(responsePolicy) {
  return (
    responsePolicy === RESPONSE_POLICIES.SINGLE_NO_EDIT ||
    responsePolicy === RESPONSE_POLICIES.SINGLE_WITH_EDIT
  );
}

function extractFileKeys(value) {
  if (!value) return [];
  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => extractFileKeys(entry))
      .filter(Boolean);
  }

  if (typeof value === "object") {
    const key =
      typeof value.key === "string"
        ? value.key.trim()
        : typeof value.url === "string"
          ? value.url.trim()
          : "";
    return key ? [key] : [];
  }

  return [];
}

async function resolveFileLinks(value, buildFileUrl) {
  if (typeof buildFileUrl !== "function") return "";
  const keys = Array.from(new Set(extractFileKeys(value)));
  if (keys.length === 0) return "";

  const urls = await Promise.all(keys.map((key) => buildFileUrl(key)));
  return urls.filter(Boolean).join(" | ");
}

export async function flattenSubmissionRows({
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
      const fieldValue = submission.consentedProfileSnapshot?.[field.key];
      if (field?.fieldType === "file") {
        row[`profile.${field.key}`] = await resolveFileLinks(
          fieldValue,
          buildFileUrl,
        );
      } else {
        row[`profile.${field.key}`] = serializeAnswerForExport(fieldValue);
      }
    }

    for (const question of questions) {
      const answerKey = question.id || question.key;
      const answerValue = answers[answerKey];

      if (question.fieldType === "file_upload" && Array.isArray(answerValue)) {
        const links = await resolveFileLinks(answerValue, buildFileUrl);
        row[`q.${question.label}`] = links;
        continue;
      }

      row[`q.${question.label}`] = serializeAnswerForExport(answerValue);
    }

    rows.push(row);
  }

  return rows;
}
