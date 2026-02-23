import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { submitRegistration } from "../lib/events/submit.js";
import { handleRegistrationPost } from "../app/api/events/[eventSlug]/registrations/route.js";

const prisma = new PrismaClient();

const EVIDENCE_SNAPSHOT = ".sisyphus/evidence/task-7-submission-snapshot.txt";
const EVIDENCE_SNAPSHOT_ERROR =
  ".sisyphus/evidence/task-7-submission-snapshot-error.txt";
const EVIDENCE_DUPLICATE_ERROR =
  ".sisyphus/evidence/task-7-submission-duplicate-error.txt";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function ensureUser(email) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "KRU",
    },
    create: {
      email,
      role: "KRU",
      name: "Test User",
    },
    select: { id: true, email: true },
  });

  return user;
}

async function createEventWithPublishedForm(slug, createdById) {
  const event = await prisma.event.create({
    data: {
      slug,
      title: "Task 7 Test Event",
      status: "published",
      createdById,
    },
    select: { id: true, slug: true },
  });

  const formSchema = {
    requestedProfileFields: ["fullName"],
    questions: [],
    consentText: "I consent to test.",
  };

  const formVersion = await prisma.eventFormVersion.create({
    data: {
      eventId: event.id,
      version: 1,
      status: "published",
      consentText: "I consent to test.",
      consentVersion: "v1",
      formSchema,
      createdById,
    },
    select: { id: true },
  });

  return { event, formVersion };
}

async function cleanupBySlugs(slugs) {
  const events = await prisma.event.findMany({
    where: {
      slug: {
        in: slugs,
      },
    },
    select: { id: true },
  });

  const eventIds = events.map((event) => event.id);
  if (!eventIds.length) {
    return;
  }

  await prisma.eventSubmission.deleteMany({
    where: {
      eventId: {
        in: eventIds,
      },
    },
  });

  await prisma.eventFormVersion.deleteMany({
    where: {
      eventId: {
        in: eventIds,
      },
    },
  });

  await prisma.eventOrganizer.deleteMany({
    where: {
      eventId: {
        in: eventIds,
      },
    },
  });

  await prisma.event.deleteMany({
    where: {
      id: {
        in: eventIds,
      },
    },
  });
}

async function main() {
  await ensureDir(EVIDENCE_SNAPSHOT);
  await ensureDir(EVIDENCE_SNAPSHOT_ERROR);
  await ensureDir(EVIDENCE_DUPLICATE_ERROR);

  const baseSlug = `task7-check-event-${Date.now()}`;
  const successSlug = `${baseSlug}-ok`;
  const consentSlug = `${baseSlug}-consent`;

  const primaryUser = await ensureUser("task7-test@example.com");
  const consentUser = await ensureUser("task7-consent@example.com");

  await cleanupBySlugs([successSlug, consentSlug]);

  const { event: successEvent, formVersion: successFormVersion } =
    await createEventWithPublishedForm(successSlug, primaryUser.id);
  const { event: consentEvent } = await createEventWithPublishedForm(
    consentSlug,
    primaryUser.id,
  );

  const created = await submitRegistration(successEvent.slug, primaryUser.id, {
    missingProfileFields: { fullName: "Test User" },
    answers: {},
    consent: { granted: true },
  });

  assert(typeof created.id === "string", "Expected submission id");
  assert(
    created.formVersionId === successFormVersion.id,
    "Expected response formVersionId to match published form",
  );

  const submission = await prisma.eventSubmission.findUnique({
    where: { id: created.id },
    select: {
      id: true,
      formVersionId: true,
      consentVersion: true,
      consentTextSnapshot: true,
      formSchemaSnapshot: true,
      consentedProfileSnapshot: true,
      answers: true,
      submitterUserId: true,
    },
  });

  assert(submission, "Submission should exist");
  assert(
    submission.submitterUserId === primaryUser.id,
    "Submitter user mismatch",
  );
  assert(
    submission.formVersionId === successFormVersion.id,
    "Form version mismatch",
  );
  assert(submission.consentVersion === "v1", "Consent version mismatch");
  assert(
    submission.consentTextSnapshot === "I consent to test.",
    "Consent text snapshot mismatch",
  );
  assert(
    submission.formSchemaSnapshot?.consentText === "I consent to test.",
    "Form schema snapshot should include consentText",
  );
  assert(
    submission.consentedProfileSnapshot?.fullName === "Test User",
    "Consented profile snapshot should include fullName",
  );

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: primaryUser.id },
    select: { biodata: true },
  });

  assert(profile, "Participant profile should exist");
  assert(
    profile.biodata?.fullName === "Test User",
    "Profile biodata must be updated",
  );

  let duplicateError = null;
  try {
    await submitRegistration(successEvent.slug, primaryUser.id, {
      missingProfileFields: { fullName: "Test User" },
      answers: {},
      consent: { granted: true },
    });
  } catch (error) {
    duplicateError = {
      code: error?.code,
      status: error?.status,
      message: error?.message,
    };
  }

  assert(duplicateError, "Expected duplicate submission to throw");
  assert(
    duplicateError.code === "already_submitted" &&
      duplicateError.status === 409,
    "Expected already_submitted with status 409",
  );

  const beforeConsentReject = await prisma.eventSubmission.count({
    where: {
      eventId: consentEvent.id,
      submitterUserId: consentUser.id,
    },
  });

  const consentRejectResponse = await handleRegistrationPost(
    consentEvent.slug,
    consentUser.id,
    {
      missingProfileFields: { fullName: "Test User" },
      answers: {},
      consent: { granted: false },
    },
  );

  const consentRejectBody = await consentRejectResponse.json();

  const afterConsentReject = await prisma.eventSubmission.count({
    where: {
      eventId: consentEvent.id,
      submitterUserId: consentUser.id,
    },
  });

  assert(
    consentRejectResponse.status === 400,
    "Expected consent rejection status 400",
  );
  assert(
    consentRejectBody?.error === "consent_required",
    "Expected consent_required error",
  );
  assert(
    beforeConsentReject === afterConsentReject,
    "Consent rejection must not create submission",
  );

  await fs.writeFile(
    EVIDENCE_SNAPSHOT,
    `${JSON.stringify(
      {
        submission: {
          id: submission.id,
          formVersionId: submission.formVersionId,
          consentVersion: submission.consentVersion,
          consentTextSnapshot: submission.consentTextSnapshot,
          formSchemaSnapshot: submission.formSchemaSnapshot,
          consentedProfileSnapshot: submission.consentedProfileSnapshot,
          answers: submission.answers,
        },
        profileBiodata: profile.biodata,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await fs.writeFile(
    EVIDENCE_SNAPSHOT_ERROR,
    `${JSON.stringify(
      {
        status: consentRejectResponse.status,
        body: consentRejectBody,
        beforeCount: beforeConsentReject,
        afterCount: afterConsentReject,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await fs.writeFile(
    EVIDENCE_DUPLICATE_ERROR,
    `${JSON.stringify(duplicateError, null, 2)}\n`,
    "utf8",
  );

  await cleanupBySlugs([successSlug, consentSlug]);

  console.log("TASK_7_SUBMISSION_OK");
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("TASK_7_SUBMISSION_FAILED", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
