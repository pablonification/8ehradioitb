import { prisma } from "@/lib/prisma";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeObject(value) {
  if (!isPlainObject(value)) {
    return {};
  }

  return value;
}

export async function submitRegistration(
  eventSlug,
  userId,
  { missingProfileFields, answers },
) {
  if (!eventSlug || typeof eventSlug !== "string") {
    throw {
      code: "invalid_payload",
      status: 400,
      message: "invalid_payload",
      details: ["eventSlug must be a non-empty string"],
    };
  }

  if (!userId || typeof userId !== "string") {
    throw {
      code: "invalid_payload",
      status: 400,
      message: "invalid_payload",
      details: ["userId must be a non-empty string"],
    };
  }

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: { id: true },
  });

  if (!event) {
    throw {
      code: "event_not_found",
      status: 404,
      message: "event_not_found",
    };
  }

  const formVersion = await prisma.eventFormVersion.findFirst({
    where: {
      eventId: event.id,
      status: "published",
    },
    orderBy: {
      version: "desc",
    },
    select: {
      id: true,
      formSchema: true,
      consentVersion: true,
    },
  });

  if (!formVersion) {
    throw {
      code: "no_published_form",
      status: 404,
      message: "no_published_form",
    };
  }

  const existingSubmission = await prisma.eventSubmission.findFirst({
    where: {
      eventId: event.id,
      submitterUserId: userId,
    },
    select: { id: true },
  });

  if (existingSubmission) {
    throw {
      code: "already_submitted",
      status: 409,
      message: "already_submitted",
    };
  }

  const participantProfile = await prisma.participantProfile.findUnique({
    where: { userId },
    select: { biodata: true },
  });

  const currentBiodata = normalizeObject(participantProfile?.biodata);
  const biodataPatch = normalizeObject(missingProfileFields);
  const updatedBiodata = {
    ...currentBiodata,
    ...biodataPatch,
  };

  const normalizedAnswers = normalizeObject(answers);
  const formSchema = normalizeObject(formVersion.formSchema);
  const consentTextSnapshot =
    typeof formSchema.consentText === "string" ? formSchema.consentText : "";

  const frozenFormSchemaSnapshot = JSON.parse(JSON.stringify(formSchema));
  const frozenConsentedProfileSnapshot = JSON.parse(
    JSON.stringify(updatedBiodata),
  );

  const [, submission] = await prisma.$transaction([
    prisma.participantProfile.upsert({
      where: { userId },
      create: {
        userId,
        biodata: updatedBiodata,
      },
      update: {
        biodata: updatedBiodata,
      },
      select: { id: true },
    }),
    prisma.eventSubmission.create({
      data: {
        eventId: event.id,
        formVersionId: formVersion.id,
        submitterUserId: userId,
        answers: normalizedAnswers,
        consentVersion: formVersion.consentVersion,
        consentTextSnapshot,
        formSchemaSnapshot: frozenFormSchemaSnapshot,
        consentedProfileSnapshot: frozenConsentedProfileSnapshot,
      },
      select: {
        id: true,
        formVersionId: true,
      },
    }),
  ]);

  return {
    id: submission.id,
    formVersionId: submission.formVersionId,
  };
}
