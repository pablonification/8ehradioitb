import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_QUESTION_FIELD_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "checkbox",
  "phone",
  "url",
  "email",
]);

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

export function validateEventQuestions(questions) {
  const errors = [];

  if (!Array.isArray(questions)) {
    return { valid: false, errors: ["questions must be an array"] };
  }

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const prefix = `questions[${index}]`;

    if (!question || typeof question !== "object" || Array.isArray(question)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }

    if (!question.key || typeof question.key !== "string") {
      errors.push(`${prefix}.key is required and must be a string`);
    }

    if (!question.label || typeof question.label !== "string") {
      errors.push(`${prefix}.label is required and must be a string`);
    }

    if (
      !question.fieldType ||
      typeof question.fieldType !== "string" ||
      !ALLOWED_QUESTION_FIELD_TYPES.has(question.fieldType)
    ) {
      errors.push(
        `${prefix}.fieldType must be one of text, textarea, number, date, select, checkbox, phone, url, email`,
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(question, "isRequired") &&
      typeof question.isRequired !== "boolean"
    ) {
      errors.push(`${prefix}.isRequired must be a boolean when provided`);
    }

    if (
      Object.prototype.hasOwnProperty.call(question, "options") &&
      question.options !== null &&
      (!Array.isArray(question.options) ||
        question.options.some((option) => typeof option !== "string"))
    ) {
      errors.push(`${prefix}.options must be null or an array of strings`);
    }

    if (
      Object.prototype.hasOwnProperty.call(question, "description") &&
      question.description !== null &&
      typeof question.description !== "string"
    ) {
      errors.push(`${prefix}.description must be a string when provided`);
    }
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

  const { requestedProfileFields, questions } = formSchema;

  if (!Array.isArray(requestedProfileFields)) {
    errors.push("requestedProfileFields must be an array");
  }

  if (!Array.isArray(questions)) {
    errors.push("questions must be an array");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const profileKeyValidation = await validateProfileFieldKeys(
    requestedProfileFields,
  );
  if (!profileKeyValidation.valid) {
    errors.push(
      `requestedProfileFields contain invalid keys: ${profileKeyValidation.invalidKeys.join(", ")}`,
    );
  }

  const questionValidation = validateEventQuestions(questions);
  if (!questionValidation.valid) {
    errors.push(...questionValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validationError(message, details, status = 400) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status },
  );
}
