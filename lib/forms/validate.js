import { prisma } from "@/lib/prisma";
import {
  normalizeFormSchema,
  QUESTION_TYPES,
  PROFILE_FIELD_TYPES,
} from "@/lib/forms/schema";

function validateQuestion(question, index, sectionIdSet) {
  const errors = [];
  const prefix = `questions[${index}]`;

  if (!question || typeof question !== "object" || Array.isArray(question)) {
    return [`${prefix} must be an object`];
  }

  if (!question.label || typeof question.label !== "string") {
    errors.push(`${prefix}.label is required and must be a string`);
  }

  if (!QUESTION_TYPES.has(question.fieldType)) {
    errors.push(
      `${prefix}.fieldType must be one of ${Array.from(QUESTION_TYPES).join(", ")}`,
    );
  }

  if (!sectionIdSet.has(question.sectionId)) {
    errors.push(`${prefix}.sectionId must reference an existing section`);
  }

  if (
    ["single_choice", "dropdown", "multi_choice"].includes(question.fieldType) &&
    (!Array.isArray(question.options) || question.options.length === 0)
  ) {
    errors.push(`${prefix}.options is required for choice/dropdown questions`);
  }

  if (question.fieldType === "linear_scale") {
    const min = Number(question.scale?.min ?? 1);
    const max = Number(question.scale?.max ?? 5);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min >= max) {
      errors.push(`${prefix}.scale min/max must be integers with min < max`);
    }
  }

  if (["mc_grid", "checkbox_grid"].includes(question.fieldType)) {
    const rows = Array.isArray(question.grid?.rows) ? question.grid.rows : [];
    const columns = Array.isArray(question.grid?.columns)
      ? question.grid.columns
      : [];
    if (rows.length === 0 || columns.length === 0) {
      errors.push(`${prefix}.grid rows and columns are required`);
    }
  }

  if (question.fieldType === "file_upload") {
    const maxFiles = Number(question.fileConfig?.maxFiles ?? 1);
    const maxSizeMB = Number(question.fileConfig?.maxSizeMB ?? 10);
    if (!Number.isInteger(maxFiles) || maxFiles < 1) {
      errors.push(`${prefix}.fileConfig.maxFiles must be integer >= 1`);
    }
    if (!Number.isFinite(maxSizeMB) || maxSizeMB <= 0) {
      errors.push(`${prefix}.fileConfig.maxSizeMB must be > 0`);
    }
  }

  if (Array.isArray(question.options)) {
    for (let i = 0; i < question.options.length; i += 1) {
      const option = question.options[i];
      if (!option || typeof option !== "object" || Array.isArray(option)) {
        errors.push(`${prefix}.options[${i}] must be an object`);
        continue;
      }
      if (!option.label || typeof option.label !== "string") {
        errors.push(`${prefix}.options[${i}].label is required`);
      }
      if (
        option.destinationSectionId &&
        option.destinationSectionId !== "__submit__" &&
        !sectionIdSet.has(option.destinationSectionId)
      ) {
        errors.push(
          `${prefix}.options[${i}].destinationSectionId must be valid section id or __submit__`,
        );
      }
    }
  }

  return errors;
}

export async function validateProfileFieldKeys(keys) {
  if (!Array.isArray(keys)) {
    return { valid: false, invalidKeys: [] };
  }

  const activeCatalogFields = await prisma.profileFieldCatalog.findMany({
    where: { isActive: true },
    select: { key: true },
  });

  const activeKeySet = new Set(activeCatalogFields.map((field) => field.key));
  const invalidKeys = keys.filter(
    (key) => typeof key !== "string" || !activeKeySet.has(key),
  );

  return {
    valid: invalidKeys.length === 0,
    invalidKeys,
  };
}

export function validateProfileCatalogField(field) {
  const errors = [];

  if (!field || typeof field !== "object" || Array.isArray(field)) {
    return { valid: false, errors: ["field must be an object"] };
  }

  if (!field.key || typeof field.key !== "string") {
    errors.push("key is required and must be a string");
  }

  if (!field.label || typeof field.label !== "string") {
    errors.push("label is required and must be a string");
  }

  if (!PROFILE_FIELD_TYPES.has(field.fieldType)) {
    errors.push(
      `fieldType must be one of ${Array.from(PROFILE_FIELD_TYPES).join(", ")}`,
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(field, "options") &&
    field.options !== null &&
    (!Array.isArray(field.options) ||
      field.options.some((option) => typeof option !== "string"))
  ) {
    errors.push("options must be null or array of string");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function validateFormSchema(formSchema) {
  const errors = [];

  if (
    !formSchema ||
    typeof formSchema !== "object" ||
    Array.isArray(formSchema)
  ) {
    return { valid: false, errors: ["formSchema must be an object"] };
  }

  const normalized = normalizeFormSchema(formSchema);

  if (!Array.isArray(normalized.requestedProfileFields)) {
    errors.push("requestedProfileFields must be an array");
  }

  if (!Array.isArray(normalized.sections) || normalized.sections.length === 0) {
    errors.push("sections must be a non-empty array");
  }

  if (!Array.isArray(normalized.questions)) {
    errors.push("questions must be an array");
  }

  const sectionIds = new Set(normalized.sections.map((section) => section.id));
  for (let index = 0; index < normalized.questions.length; index += 1) {
    errors.push(...validateQuestion(normalized.questions[index], index, sectionIds));
  }

  const profileKeyValidation = await validateProfileFieldKeys(
    normalized.requestedProfileFields,
  );

  if (!profileKeyValidation.valid) {
    errors.push(
      `requestedProfileFields contain invalid keys: ${profileKeyValidation.invalidKeys.join(", ")}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized,
  };
}
