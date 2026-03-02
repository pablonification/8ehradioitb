import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";
import { writeFileSync } from "node:fs";
import { seedProfileFields } from "./seed-profile-fields.mjs";

const prisma = new PrismaClient();

const SUCCESS_EVIDENCE_PATH = ".sisyphus/evidence/task-5-form-versioning.txt";
const ERROR_EVIDENCE_PATH =
  ".sisyphus/evidence/task-5-form-versioning-error.txt";

const DEVELOPER_USER_ID = "507f191e810c19729de860ea";
const DEVELOPER_EMAIL = "task5-developer@8eh.local";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeErrorPayload(payload) {
  return {
    error: payload?.error ?? "Unknown error",
    details: payload?.details ?? null,
  };
}

async function buildAuthCookie() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required");
  }

  const token = await encode({
    token: {
      sub: DEVELOPER_USER_ID,
      role: "DEVELOPER",
      email: DEVELOPER_EMAIL,
      name: "Task 5 Developer",
    },
    secret,
    maxAge: 60 * 60,
    salt: "next-auth.session-token",
  });

  return `next-auth.session-token=${token}`;
}

async function callApi(baseUrl, cookie, path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      cookie,
      ...(init.headers ?? {}),
    },
  });

  let json = null;
  try {
    json = await response.json();
  } catch (_error) {
    json = null;
  }

  return { response, json };
}

async function main() {
  const baseUrl = process.env.TASK_5_BASE_URL || "http://localhost:3000";

  await seedProfileFields();
  await prisma.user.upsert({
    where: {
      id: DEVELOPER_USER_ID,
    },
    update: {
      email: DEVELOPER_EMAIL,
      role: "DEVELOPER",
      name: "Task 5 Developer",
    },
    create: {
      id: DEVELOPER_USER_ID,
      email: DEVELOPER_EMAIL,
      role: "DEVELOPER",
      name: "Task 5 Developer",
    },
  });

  const cookie = await buildAuthCookie();
  const slug = `task-5-event-${Date.now()}`;

  const createEventResult = await callApi(baseUrl, cookie, "/api/events", {
    method: "POST",
    body: JSON.stringify({
      slug,
      title: "Task 5 Event",
      description: "Task 5 event description",
    }),
  });

  assert(
    createEventResult.response.status === 201,
    `Expected create event to return 201, got ${createEventResult.response.status}`,
  );
  assert(
    createEventResult.json?.slug === slug,
    "Expected create event response to include created slug",
  );

  const firstDraftResult = await callApi(
    baseUrl,
    cookie,
    `/api/events/${slug}/form-versions`,
    {
      method: "POST",
      body: JSON.stringify({
        requestedProfileFields: ["fullName", "activePhone"],
        questions: [
          {
            key: "shirtSize",
            label: "T-shirt size",
            fieldType: "select",
            options: ["S", "M", "L"],
            isRequired: true,
          },
        ],
        consentText:
          "I allow my requested profile fields to be used for this event.",
      }),
    },
  );

  assert(
    firstDraftResult.response.status === 201,
    `Expected first draft creation to return 201, got ${firstDraftResult.response.status}`,
  );

  const firstDraftId = firstDraftResult.json?.id;
  assert(firstDraftId, "Expected first draft id to exist");

  const firstPublishResult = await callApi(
    baseUrl,
    cookie,
    `/api/events/${slug}/form-versions/${firstDraftId}/publish`,
    {
      method: "POST",
    },
  );

  assert(
    firstPublishResult.response.status === 201,
    `Expected first publish to return 201, got ${firstPublishResult.response.status}`,
  );
  assert(
    firstPublishResult.json?.version === 1,
    `Expected first published version to be 1, got ${firstPublishResult.json?.version}`,
  );

  const secondDraftResult = await callApi(
    baseUrl,
    cookie,
    `/api/events/${slug}/form-versions`,
    {
      method: "POST",
      body: JSON.stringify({
        requestedProfileFields: ["fullName", "activePhone", "lineId"],
        questions: [
          {
            key: "shirtSize",
            label: "T-shirt size",
            fieldType: "select",
            options: ["S", "M", "L", "XL"],
            isRequired: true,
          },
          {
            key: "foodPreference",
            label: "Food preference",
            fieldType: "text",
            isRequired: false,
          },
        ],
        consentText:
          "I allow my requested profile fields to be used for event version 2.",
      }),
    },
  );

  assert(
    secondDraftResult.response.status === 201,
    `Expected second draft creation to return 201, got ${secondDraftResult.response.status}`,
  );

  const secondDraftId = secondDraftResult.json?.id;
  assert(secondDraftId, "Expected second draft id to exist");

  const secondPublishResult = await callApi(
    baseUrl,
    cookie,
    `/api/events/${slug}/form-versions/${secondDraftId}/publish`,
    {
      method: "POST",
    },
  );

  assert(
    secondPublishResult.response.status === 201,
    `Expected second publish to return 201, got ${secondPublishResult.response.status}`,
  );
  assert(
    secondPublishResult.json?.version === 2,
    `Expected second published version to be 2, got ${secondPublishResult.json?.version}`,
  );

  const listVersionsResult = await callApi(
    baseUrl,
    cookie,
    `/api/events/${slug}/form-versions`,
    {
      method: "GET",
    },
  );

  assert(
    listVersionsResult.response.status === 200,
    `Expected list versions to return 200, got ${listVersionsResult.response.status}`,
  );

  const publishedVersions = (listVersionsResult.json ?? []).filter(
    (version) => version.status === "published",
  );
  assert(
    publishedVersions.length === 2,
    `Expected 2 published versions, got ${publishedVersions.length}`,
  );

  const versionOne = publishedVersions.find((version) => version.version === 1);
  const versionTwo = publishedVersions.find((version) => version.version === 2);
  assert(Boolean(versionOne), "Expected version 1 to remain readable");
  assert(Boolean(versionTwo), "Expected version 2 to be readable");
  assert(
    Array.isArray(versionOne.requestedProfileFields) &&
      versionOne.requestedProfileFields.length === 2,
    "Expected version 1 requestedProfileFields to remain unchanged",
  );
  assert(
    Array.isArray(versionTwo.requestedProfileFields) &&
      versionTwo.requestedProfileFields.length === 3,
    "Expected version 2 requestedProfileFields to include schema update",
  );

  const invalidDraft = await prisma.eventFormVersion.create({
    data: {
      eventId: createEventResult.json.id,
      version: 0,
      status: "draft",
      formSchema: {
        requestedProfileFields: ["unknownProfileFieldKey"],
        questions: [
          {
            key: "freeForm",
            label: "Free form",
            fieldType: "text",
          },
        ],
        consentText: "Invalid field draft",
      },
      consentText: "Invalid field draft",
      consentVersion: "draft",
      createdById: DEVELOPER_USER_ID,
    },
  });

  const invalidPublishResult = await callApi(
    baseUrl,
    cookie,
    `/api/events/${slug}/form-versions/${invalidDraft.id}/publish`,
    {
      method: "POST",
    },
  );

  assert(
    invalidPublishResult.response.status === 400,
    `Expected invalid publish to return 400, got ${invalidPublishResult.response.status}`,
  );

  const invalidPayload = normalizeErrorPayload(invalidPublishResult.json);
  writeFileSync(
    SUCCESS_EVIDENCE_PATH,
    [
      `eventSlug=${slug}`,
      `firstPublishedVersion=${firstPublishResult.json.version}`,
      `secondPublishedVersion=${secondPublishResult.json.version}`,
      `publishedVersionsReadback=${publishedVersions.map((v) => v.version).join(",")}`,
      `version1RequestedFields=${versionOne.requestedProfileFields.join(",")}`,
      `version2RequestedFields=${versionTwo.requestedProfileFields.join(",")}`,
      "immutableReadback=true",
    ].join("\n"),
  );

  writeFileSync(
    ERROR_EVIDENCE_PATH,
    [
      `status=${invalidPublishResult.response.status}`,
      `error=${invalidPayload.error}`,
      `details=${JSON.stringify(invalidPayload.details)}`,
    ].join("\n"),
  );

  console.log("TASK_5_FORM_VERSIONING_OK");
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("TASK_5_FORM_VERSIONING_FAILED", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
