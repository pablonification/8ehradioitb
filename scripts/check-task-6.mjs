import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { resolveParticipantEventForm } from "../lib/events/formRead.js";

const prisma = new PrismaClient();
const EVIDENCE_SUCCESS =
  ".sisyphus/evidence/task-6-form-read-missing-fields.txt";
const EVIDENCE_ERROR =
  ".sisyphus/evidence/task-6-form-read-missing-fields-error.txt";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function ensureUser(index) {
  const existing = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    take: 2,
    select: { id: true, email: true },
  });

  if (existing[index]) {
    return existing[index].id;
  }

  const created = await prisma.user.create({
    data: {
      email: `task6-user-${Date.now()}-${index}@example.com`,
      role: "KRU",
    },
    select: { id: true },
  });

  return created.id;
}

async function setupFixtures() {
  const createdById = await ensureUser(0);
  const incompleteUserId = await ensureUser(1);
  const completeUserId = await ensureUser(0);

  const now = Date.now();
  const publishedSlug = `task6-published-${now}`;
  const draftOnlySlug = `task6-no-published-${now}`;

  const publishedEvent = await prisma.event.create({
    data: {
      slug: publishedSlug,
      title: "Task 6 Published Event",
      createdById,
      status: "published",
    },
    select: { id: true, slug: true, title: true },
  });

  await prisma.eventFormVersion.create({
    data: {
      eventId: publishedEvent.id,
      version: 1,
      status: "published",
      consentText: "I consent to share profile data for this event.",
      consentVersion: "v1",
      formSchema: {
        requestedProfileFields: ["fullName", "activePhone"],
        questions: [
          {
            key: "motivation",
            label: "Why do you want to join?",
            fieldType: "textarea",
            isRequired: true,
            options: null,
          },
        ],
      },
      createdById,
    },
  });

  const noPublishedEvent = await prisma.event.create({
    data: {
      slug: draftOnlySlug,
      title: "Task 6 Draft Only Event",
      createdById,
      status: "draft",
    },
    select: { id: true, slug: true },
  });

  await prisma.eventFormVersion.create({
    data: {
      eventId: noPublishedEvent.id,
      version: 1,
      status: "draft",
      consentText: "Draft consent",
      consentVersion: "v1",
      formSchema: {
        requestedProfileFields: ["fullName"],
        questions: [],
      },
      createdById,
    },
  });

  await prisma.participantProfile.upsert({
    where: { userId: incompleteUserId },
    update: {
      biodata: {
        fullName: "Task 6 Incomplete",
      },
    },
    create: {
      userId: incompleteUserId,
      displayName: "Task 6 Incomplete",
      biodata: {
        fullName: "Task 6 Incomplete",
      },
    },
  });

  await prisma.participantProfile.upsert({
    where: { userId: completeUserId },
    update: {
      biodata: {
        fullName: "Task 6 Complete",
        activePhone: "+628123456789",
      },
    },
    create: {
      userId: completeUserId,
      displayName: "Task 6 Complete",
      biodata: {
        fullName: "Task 6 Complete",
        activePhone: "+628123456789",
      },
    },
  });

  return {
    publishedSlug,
    draftOnlySlug,
    incompleteUserId,
    completeUserId,
  };
}

async function main() {
  await ensureDir(EVIDENCE_SUCCESS);
  await ensureDir(EVIDENCE_ERROR);

  const fixture = await setupFixtures();

  const noPublishedResult = await resolveParticipantEventForm(
    fixture.draftOnlySlug,
    fixture.incompleteUserId,
  );
  assert(
    noPublishedResult.status === 404,
    "Expected 404 for no published form",
  );
  assert(
    noPublishedResult.body?.error === "no_published_form",
    "Expected no_published_form error code",
  );

  await fs.writeFile(
    EVIDENCE_ERROR,
    `${JSON.stringify(noPublishedResult, null, 2)}\n`,
    "utf8",
  );

  const incompleteResult = await resolveParticipantEventForm(
    fixture.publishedSlug,
    fixture.incompleteUserId,
  );
  assert(incompleteResult.status === 200, "Expected 200 for published event");
  assert(
    Array.isArray(incompleteResult.body?.missingProfileFields),
    "missingProfileFields should be an array",
  );
  assert(
    incompleteResult.body.missingProfileFields.includes("activePhone"),
    "Expected activePhone to be missing for incomplete profile",
  );

  const completeResult = await resolveParticipantEventForm(
    fixture.publishedSlug,
    fixture.completeUserId,
  );
  assert(completeResult.status === 200, "Expected 200 for complete profile");
  assert(
    Array.isArray(completeResult.body?.missingProfileFields),
    "missingProfileFields should be an array for complete profile",
  );
  assert(
    completeResult.body.missingProfileFields.length === 0,
    "Expected no missing profile fields for complete profile",
  );

  assert(
    completeResult.body &&
      completeResult.body.event &&
      completeResult.body.formVersion &&
      Array.isArray(completeResult.body.requestedProfileFields) &&
      Array.isArray(completeResult.body.questions) &&
      typeof completeResult.body.consentText === "string",
    "Response shape does not match expected contract",
  );

  const successPayload = {
    publishedEventResultForIncompleteProfile: incompleteResult,
    publishedEventResultForCompleteProfile: completeResult,
  };

  await fs.writeFile(
    EVIDENCE_SUCCESS,
    `${JSON.stringify(successPayload, null, 2)}\n`,
    "utf8",
  );

  console.log("TASK_6_FORM_READ_OK");
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("TASK_6_FORM_READ_FAILED", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
