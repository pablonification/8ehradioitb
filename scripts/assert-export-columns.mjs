import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FIXED_COLUMNS = [
  "submissionId",
  "submittedAt",
  "consentVersion",
  "submitterName",
  "submitterEmail",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseArgs(argv) {
  const result = {
    eventSlug: null,
    version: null,
    expectedPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--event") {
      result.eventSlug = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--version") {
      const parsed = Number.parseInt(argv[index + 1] ?? "", 10);
      result.version = Number.isFinite(parsed) ? parsed : null;
      index += 1;
      continue;
    }

    if (token === "--expected") {
      result.expectedPath = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return result;
}

function normalizeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function buildExpectedColumns(formSchema) {
  const schema = normalizeObject(formSchema);
  const requestedProfileFields = Array.isArray(schema.requestedProfileFields)
    ? schema.requestedProfileFields.filter((value) => typeof value === "string")
    : [];
  const questions = Array.isArray(schema.questions)
    ? schema.questions.filter(
        (value) =>
          value && typeof value === "object" && typeof value.key === "string",
      )
    : [];

  const profileColumns = requestedProfileFields.map((key) => `profile.${key}`);
  const answerColumns = questions.map((question) => `answer.${question.key}`);

  return {
    requestedProfileFields,
    questionKeys: questions.map((question) => question.key),
    columns: [...FIXED_COLUMNS, ...profileColumns, ...answerColumns],
  };
}

function collectUnexpectedKeys(
  submissions,
  declaredProfileKeys,
  declaredQuestionKeys,
) {
  const declaredProfileSet = new Set(declaredProfileKeys);
  const declaredQuestionSet = new Set(declaredQuestionKeys);

  const unexpectedProfileKeys = new Set();
  const unexpectedAnswerKeys = new Set();

  for (const submission of submissions) {
    const profileSnapshot = normalizeObject(
      submission.consentedProfileSnapshot,
    );
    const answers = normalizeObject(submission.answers);

    for (const key of Object.keys(profileSnapshot)) {
      if (!declaredProfileSet.has(key)) {
        unexpectedProfileKeys.add(key);
      }
    }

    for (const key of Object.keys(answers)) {
      if (!declaredQuestionSet.has(key)) {
        unexpectedAnswerKeys.add(key);
      }
    }
  }

  return {
    unexpectedProfileKeys: [...unexpectedProfileKeys],
    unexpectedAnswerKeys: [...unexpectedAnswerKeys],
  };
}

async function maybeReadExpectedColumns(expectedPath) {
  if (!expectedPath) {
    return null;
  }

  const raw = await fs.readFile(expectedPath, "utf8");
  const parsed = JSON.parse(raw);
  assert(
    Array.isArray(parsed),
    "Expected columns fixture must be a JSON array",
  );

  const normalized = parsed.filter((value) => typeof value === "string");
  assert(
    normalized.length === parsed.length,
    "Expected columns fixture must contain strings only",
  );

  return normalized;
}

async function main() {
  const { eventSlug, version, expectedPath } = parseArgs(process.argv.slice(2));

  assert(
    typeof eventSlug === "string" && eventSlug.trim().length > 0,
    "Usage: bun scripts/assert-export-columns.mjs --event <event-slug> --version <version> [--expected <json-file>]",
  );
  assert(
    Number.isInteger(version) && version > 0,
    "--version must be a positive integer",
  );

  const event = await prisma.event.findUnique({
    where: {
      slug: eventSlug,
    },
    select: {
      id: true,
    },
  });

  assert(Boolean(event), `Event not found: ${eventSlug}`);

  const formVersion = await prisma.eventFormVersion.findFirst({
    where: {
      eventId: event.id,
      version,
      status: "published",
    },
    select: {
      id: true,
      formSchema: true,
    },
  });

  assert(
    Boolean(formVersion),
    `Published form version not found: ${eventSlug} v${version}`,
  );

  const expected = buildExpectedColumns(formVersion.formSchema);
  const expectedRunTwo = buildExpectedColumns(formVersion.formSchema);

  assert(
    JSON.stringify(expected.columns) === JSON.stringify(expectedRunTwo.columns),
    "Column generation is not deterministic",
  );

  const submissions = await prisma.eventSubmission.findMany({
    where: {
      eventId: event.id,
      formVersionId: formVersion.id,
    },
    select: {
      answers: true,
      consentedProfileSnapshot: true,
    },
  });

  const unexpectedKeys = collectUnexpectedKeys(
    submissions,
    expected.requestedProfileFields,
    expected.questionKeys,
  );

  assert(
    unexpectedKeys.unexpectedProfileKeys.length === 0,
    `Unexpected profile snapshot keys: ${unexpectedKeys.unexpectedProfileKeys.join(", ")}`,
  );
  assert(
    unexpectedKeys.unexpectedAnswerKeys.length === 0,
    `Unexpected answer keys: ${unexpectedKeys.unexpectedAnswerKeys.join(", ")}`,
  );

  const expectedFixtureColumns = await maybeReadExpectedColumns(expectedPath);
  if (expectedFixtureColumns) {
    assert(
      JSON.stringify(expectedFixtureColumns) ===
        JSON.stringify(expected.columns),
      [
        "Export column mismatch",
        `Expected: ${JSON.stringify(expectedFixtureColumns)}`,
        `Actual:   ${JSON.stringify(expected.columns)}`,
      ].join("\n"),
    );
  }

  console.log("EXPORT_COLUMNS_STABLE");
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("EXPORT_COLUMNS_UNSTABLE", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
