import { hasRole } from "@/lib/roleUtils";

export const AUDIENCE_MODES = {
  PUBLIC: "PUBLIC",
  INTERNAL_KRU: "INTERNAL_KRU",
};

export const RESPONSE_POLICIES = {
  MULTIPLE: "MULTIPLE",
  SINGLE_NO_EDIT: "SINGLE_NO_EDIT",
  SINGLE_WITH_EDIT: "SINGLE_WITH_EDIT",
};

export const COLLECT_EMAIL_MODES = {
  NONE: "none",
  OPTIONAL: "optional",
  REQUIRED: "required",
};

export const QUESTION_TYPES = new Set([
  "short_text",
  "paragraph",
  "single_choice",
  "multi_choice",
  "dropdown",
  "linear_scale",
  "date",
  "time",
  "file_upload",
  "mc_grid",
  "checkbox_grid",
]);

const LEGACY_QUESTION_TYPE_MAP = {
  text: "short_text",
  textarea: "paragraph",
  number: "short_text",
  select: "dropdown",
  checkbox: "multi_choice",
  phone: "short_text",
  url: "short_text",
  email: "short_text",
};

export const PROFILE_FIELD_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "checkbox",
  "phone",
  "url",
  "email",
  "file",
]);

const DEFAULT_SETTINGS = {
  audienceMode: AUDIENCE_MODES.INTERNAL_KRU,
  collectEmailMode: COLLECT_EMAIL_MODES.NONE,
  responsePolicy: RESPONSE_POLICIES.SINGLE_WITH_EDIT,
  isAcceptingResponses: true,
  deadlineAt: null,
  closedMessageTitle: "Form closed",
  closedMessageDescription: "Form ini sudah ditutup.",
};

const DEFAULT_CONFIRMATION = {
  title: "Respons Anda telah direkam",
  message: "Terima kasih sudah mengisi form.",
  redirectUrl: "",
};

function looksLikeHost(input) {
  if (!input || typeof input !== "string") return false;

  return /^(localhost|(\d{1,3}\.){3}\d{1,3}|[a-z0-9-]+(\.[a-z0-9-]+)+)(:\d+)?(\/.*)?$/i.test(
    input,
  );
}

function normalizeRedirectUrl(input) {
  if (typeof input !== "string") return "";

  const value = input.trim();
  if (!value) return "";

  // Internal path redirects are supported.
  if (value.startsWith("/") || value.startsWith("?") || value.startsWith("#")) {
    return value;
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
  if (hasScheme) {
    try {
      const parsed = new URL(value);
      const protocol = parsed.protocol.toLowerCase();
      if (protocol === "http:" || protocol === "https:") {
        return parsed.toString();
      }
      return "";
    } catch {
      return "";
    }
  }

  if (value.startsWith("//")) {
    try {
      return new URL(`https:${value}`).toString();
    } catch {
      return "";
    }
  }

  if (/\s/.test(value)) {
    return "";
  }

  if (looksLikeHost(value)) {
    const useHttp = /^localhost(:\d+)?(\/.*)?$/i.test(value) || /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/i.test(value);
    const prefix = useHttp ? "http://" : "https://";
    try {
      return new URL(`${prefix}${value}`).toString();
    } catch {
      return "";
    }
  }

  // Last fallback: treat as internal relative path token like "thank-you".
  return `/${value.replace(/^\/+/, "")}`;
}

function asObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}

function normalizeOption(option, index) {
  if (typeof option === "string") {
    return {
      id: `opt_${index + 1}`,
      label: option,
      destinationSectionId: null,
    };
  }

  if (!option || typeof option !== "object" || Array.isArray(option)) {
    return null;
  }

  const label = typeof option.label === "string" ? option.label.trim() : "";
  if (!label) return null;

  return {
    id:
      typeof option.id === "string" && option.id.trim()
        ? option.id.trim()
        : `opt_${index + 1}`,
    label,
    destinationSectionId:
      typeof option.destinationSectionId === "string"
        ? option.destinationSectionId
        : null,
  };
}

function normalizeQuestion(question, index, fallbackSectionId) {
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    return null;
  }

  const rawFieldType =
    typeof question.fieldType === "string" ? question.fieldType : "short_text";
  const mappedFieldType =
    LEGACY_QUESTION_TYPE_MAP[rawFieldType] || rawFieldType;
  const fieldType = QUESTION_TYPES.has(mappedFieldType)
    ? mappedFieldType
    : "short_text";

  const normalized = {
    id:
      typeof question.id === "string" && question.id.trim()
        ? question.id.trim()
        : `q_${index + 1}`,
    key:
      typeof question.key === "string" && question.key.trim()
        ? question.key.trim()
        : `q_${index + 1}`,
    label:
      typeof question.label === "string" && question.label.trim()
        ? question.label.trim()
        : `Untitled Question ${index + 1}`,
    description:
      typeof question.description === "string" ? question.description : "",
    fieldType,
    isRequired: Boolean(question.isRequired),
    sectionId:
      typeof question.sectionId === "string" && question.sectionId.trim()
        ? question.sectionId.trim()
        : fallbackSectionId,
    options: Array.isArray(question.options)
      ? question.options
          .map((option, optionIndex) => normalizeOption(option, optionIndex))
          .filter(Boolean)
      : [],
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
              : [],
            columns: Array.isArray(question.grid.columns)
              ? question.grid.columns.filter(
                  (column) => typeof column === "string",
                )
              : [],
          }
        : { rows: [], columns: [] },
    fileConfig:
      question.fileConfig && typeof question.fileConfig === "object"
        ? {
            maxFiles: Number.isFinite(Number(question.fileConfig.maxFiles))
              ? Math.max(1, Number(question.fileConfig.maxFiles))
              : 1,
            maxSizeMB: Number.isFinite(Number(question.fileConfig.maxSizeMB))
              ? Math.max(1, Number(question.fileConfig.maxSizeMB))
              : 10,
            allowedMimeTypes: Array.isArray(question.fileConfig.allowedMimeTypes)
              ? question.fileConfig.allowedMimeTypes.filter(
                  (mime) => typeof mime === "string",
                )
              : [],
          }
        : {
            maxFiles: 1,
            maxSizeMB: 10,
            allowedMimeTypes: [],
          },
  };

  return normalized;
}

function normalizeSection(section, index) {
  if (!section || typeof section !== "object" || Array.isArray(section)) {
    return null;
  }

  return {
    id:
      typeof section.id === "string" && section.id.trim()
        ? section.id.trim()
        : `section_${index + 1}`,
    title:
      typeof section.title === "string" && section.title.trim()
        ? section.title.trim()
        : `Bagian ${index + 1}`,
    description:
      typeof section.description === "string" ? section.description : "",
  };
}

export function normalizeFormSchema(rawSchema) {
  const schema = asObject(rawSchema);

  const settingsInput = asObject(schema.settings);
  const confirmationInput = asObject(schema.confirmation);

  const settings = {
    ...DEFAULT_SETTINGS,
    ...settingsInput,
  };

  if (!Object.values(AUDIENCE_MODES).includes(settings.audienceMode)) {
    settings.audienceMode = DEFAULT_SETTINGS.audienceMode;
  }

  if (!Object.values(COLLECT_EMAIL_MODES).includes(settings.collectEmailMode)) {
    settings.collectEmailMode = DEFAULT_SETTINGS.collectEmailMode;
  }

  if (!Object.values(RESPONSE_POLICIES).includes(settings.responsePolicy)) {
    settings.responsePolicy = DEFAULT_SETTINGS.responsePolicy;
  }

  settings.isAcceptingResponses = Boolean(settings.isAcceptingResponses);
  settings.deadlineAt =
    typeof settings.deadlineAt === "string" && settings.deadlineAt
      ? settings.deadlineAt
      : null;

  const confirmation = {
    ...DEFAULT_CONFIRMATION,
    ...confirmationInput,
  };
  confirmation.redirectUrl = normalizeRedirectUrl(confirmation.redirectUrl);

  const sections = Array.isArray(schema.sections)
    ? schema.sections.map(normalizeSection).filter(Boolean)
    : [];

  if (sections.length === 0) {
    sections.push({
      id: "section_1",
      title: "Bagian 1",
      description: "",
    });
  }

  const questions = Array.isArray(schema.questions)
    ? schema.questions
        .map((question, index) =>
          normalizeQuestion(question, index, sections[0].id),
        )
        .filter(Boolean)
    : [];

  const requestedProfileFields = Array.isArray(schema.requestedProfileFields)
    ? schema.requestedProfileFields.filter((key) => typeof key === "string")
    : [];

  const consentText =
    typeof schema.consentText === "string" && schema.consentText.trim()
      ? schema.consentText.trim()
      : "Saya menyetujui penggunaan data profil yang diminta untuk form ini.";

  return {
    requestedProfileFields,
    sections,
    questions,
    settings,
    confirmation,
    consentText,
  };
}

export function isFormClosed(normalizedSchema) {
  const settings = asObject(normalizedSchema?.settings);
  if (settings.isAcceptingResponses === false) {
    return true;
  }

  if (typeof settings.deadlineAt === "string" && settings.deadlineAt) {
    const deadline = new Date(settings.deadlineAt);
    if (!Number.isNaN(deadline.getTime()) && Date.now() > deadline.getTime()) {
      return true;
    }
  }

  return false;
}

export function getClosedMessage(normalizedSchema) {
  const settings = asObject(normalizedSchema?.settings);
  return {
    title:
      typeof settings.closedMessageTitle === "string" &&
      settings.closedMessageTitle.trim()
        ? settings.closedMessageTitle
        : DEFAULT_SETTINGS.closedMessageTitle,
    description:
      typeof settings.closedMessageDescription === "string" &&
      settings.closedMessageDescription.trim()
        ? settings.closedMessageDescription
        : DEFAULT_SETTINGS.closedMessageDescription,
  };
}

export function isInternalAudience(normalizedSchema) {
  const settings = asObject(normalizedSchema?.settings);
  return settings.audienceMode === AUDIENCE_MODES.INTERNAL_KRU;
}

export function isKruRole(roleString) {
  return hasRole(roleString, "KRU");
}

export function getFormConfirmation(normalizedSchema) {
  const confirmation = asObject(normalizedSchema?.confirmation);
  return {
    title:
      typeof confirmation.title === "string" && confirmation.title.trim()
        ? confirmation.title.trim()
        : DEFAULT_CONFIRMATION.title,
    message:
      typeof confirmation.message === "string" && confirmation.message.trim()
        ? confirmation.message.trim()
        : DEFAULT_CONFIRMATION.message,
    redirectUrl:
      typeof confirmation.redirectUrl === "string"
        ? normalizeRedirectUrl(confirmation.redirectUrl)
        : "",
  };
}

export function serializeAnswerForExport(value) {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value
      .map((entry) => serializeAnswerForExport(entry))
      .filter(Boolean)
      .join(" | ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
