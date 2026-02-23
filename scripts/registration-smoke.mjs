import { PrismaClient } from "@prisma/client";
import { seedProfileFields } from "./seed-profile-fields.mjs";
import { resolveParticipantEventForm } from "../lib/events/formRead.js";
import { handleRegistrationPost } from "../app/api/events/[eventSlug]/registrations/route.js";

const prisma = new PrismaClient();

const ORGANIZER_USER_ID = "507f191e810c19729de860f1";
const PARTICIPANT_USER_ID = "507f191e810c19729de860f2";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function ensureUsers() {
  await prisma.user.upsert({
    where: { id: ORGANIZER_USER_ID },
    update: {
      email: "smoke-organizer@8eh.local",
      role: "DEVELOPER",
      name: "Smoke Organizer",
    },
    create: {
      id: ORGANIZER_USER_ID,
      email: "smoke-organizer@8eh.local",
      role: "DEVELOPER",
      name: "Smoke Organizer",
    },
  });

  await prisma.user.upsert({
    where: { id: PARTICIPANT_USER_ID },
    update: {
      email: "smoke-participant@8eh.local",
      role: "KRU",
      name: "Smoke Participant",
    },
    create: {
      id: PARTICIPANT_USER_ID,
      email: "smoke-participant@8eh.local",
      role: "KRU",
      name: "Smoke Participant",
    },
  });
}

async function createPublishedEventFixture() {
  const slug = `registration-smoke-${Date.now()}`;

  const event = await prisma.event.create({
    data: {
      slug,
      title: "Registration Smoke Event",
      description: "Registration smoke flow fixture",
      status: "published",
      createdById: ORGANIZER_USER_ID,
      organizers: {
        create: {
          userId: ORGANIZER_USER_ID,
          role: "owner",
        },
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  const formVersion = await prisma.eventFormVersion.create({
    data: {
      eventId: event.id,
      version: 1,
      status: "published",
      consentText: "I consent to this event registration.",
      consentVersion: "v1",
      formSchema: {
        requestedProfileFields: ["fullName", "activePhone"],
        questions: [
          {
            key: "motivation",
            label: "Why do you want to join?",
            fieldType: "textarea",
            isRequired: true,
          },
        ],
        consentText: "I consent to this event registration.",
      },
      createdById: ORGANIZER_USER_ID,
      publishedAt: new Date(),
    },
    select: {
      id: true,
      version: true,
    },
  });

  return {
    event,
    formVersion,
  };
}

async function main() {
  await seedProfileFields();
  await ensureUsers();

  const { event, formVersion } = await createPublishedEventFixture();

  const participantForm = await resolveParticipantEventForm(
    event.slug,
    PARTICIPANT_USER_ID,
  );

  assert(
    participantForm.status === 200,
    `Expected form read 200, got ${participantForm.status}`,
  );
  assert(
    Array.isArray(participantForm.body?.missingProfileFields),
    "Expected missingProfileFields array",
  );
  assert(
    participantForm.body.missingProfileFields.includes("fullName") &&
      participantForm.body.missingProfileFields.includes("activePhone"),
    "Expected missing profile fields to include fullName and activePhone",
  );

  const submitResponse = await handleRegistrationPost(
    event.slug,
    PARTICIPANT_USER_ID,
    {
      missingProfileFields: {
        fullName: "Smoke Participant",
        activePhone: "+6281000000001",
      },
      answers: {
        motivation: "Smoke test answer",
      },
      consent: {
        granted: true,
      },
    },
  );

  assert(
    submitResponse.status === 201,
    `Expected submit 201, got ${submitResponse.status}`,
  );

  const submitBody = await submitResponse.json();
  assert(
    typeof submitBody?.id === "string" && submitBody.id.length > 0,
    "Expected submission id",
  );
  assert(
    submitBody.formVersionId === formVersion.id,
    "Expected formVersionId to match published form version",
  );

  const createdSubmission = await prisma.eventSubmission.findUnique({
    where: {
      id: submitBody.id,
    },
    select: {
      id: true,
      eventId: true,
      formVersionId: true,
      consentVersion: true,
      consentedProfileSnapshot: true,
      answers: true,
    },
  });

  assert(Boolean(createdSubmission), "Expected submission to exist");
  assert(
    createdSubmission.eventId === event.id,
    "Expected submission eventId to match event",
  );
  assert(
    createdSubmission.formVersionId === formVersion.id,
    "Expected submission formVersionId to match form version",
  );
  assert(
    createdSubmission.consentVersion === "v1",
    "Expected consentVersion v1",
  );

  const profileSnapshot = createdSubmission.consentedProfileSnapshot;
  assert(
    profileSnapshot &&
      typeof profileSnapshot === "object" &&
      profileSnapshot.fullName === "Smoke Participant" &&
      profileSnapshot.activePhone === "+6281000000001",
    "Expected consentedProfileSnapshot to include submitted profile fields",
  );

  const answerSnapshot = createdSubmission.answers;
  assert(
    answerSnapshot &&
      typeof answerSnapshot === "object" &&
      answerSnapshot.motivation === "Smoke test answer",
    "Expected answers snapshot to include motivation answer",
  );

  console.log("REGISTRATION_SMOKE_OK");
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("REGISTRATION_SMOKE_FAILED", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
