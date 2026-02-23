import { prisma } from "@/lib/prisma";

function normalizeRequestedKeys(formSchema) {
  if (
    !formSchema ||
    typeof formSchema !== "object" ||
    Array.isArray(formSchema)
  ) {
    return [];
  }

  if (!Array.isArray(formSchema.requestedProfileFields)) {
    return [];
  }

  return formSchema.requestedProfileFields.filter(
    (key) => typeof key === "string",
  );
}

function normalizeQuestions(formSchema) {
  if (
    !formSchema ||
    typeof formSchema !== "object" ||
    Array.isArray(formSchema)
  ) {
    return [];
  }

  if (!Array.isArray(formSchema.questions)) {
    return [];
  }

  return formSchema.questions;
}

export async function resolveParticipantEventForm(eventSlug, userId) {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  if (!event) {
    return {
      status: 404,
      body: { error: "event_not_found" },
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
      version: true,
      consentText: true,
      formSchema: true,
    },
  });

  if (!formVersion) {
    return {
      status: 404,
      body: { error: "no_published_form" },
    };
  }

  const requestedKeys = normalizeRequestedKeys(formVersion.formSchema);
  const questions = normalizeQuestions(formVersion.formSchema);

  const participantProfile = await prisma.participantProfile.findUnique({
    where: { userId },
    select: { biodata: true },
  });

  const biodata =
    participantProfile &&
    participantProfile.biodata &&
    typeof participantProfile.biodata === "object" &&
    !Array.isArray(participantProfile.biodata)
      ? participantProfile.biodata
      : null;

  const catalogFields = requestedKeys.length
    ? await prisma.profileFieldCatalog.findMany({
        where: {
          key: {
            in: requestedKeys,
          },
        },
        select: {
          key: true,
          label: true,
          fieldType: true,
          isRequired: true,
          options: true,
        },
      })
    : [];

  const catalogByKey = new Map(
    catalogFields.map((field) => [field.key, field]),
  );

  const requestedProfileFields = requestedKeys.map((key) => {
    const catalogField = catalogByKey.get(key);
    if (!catalogField) {
      return {
        key,
        label: key,
        fieldType: "text",
        isRequired: false,
        options: null,
      };
    }

    return {
      key: catalogField.key,
      label: catalogField.label,
      fieldType: catalogField.fieldType,
      isRequired: catalogField.isRequired,
      options: catalogField.options ?? null,
    };
  });

  const missingProfileFields = requestedKeys.filter(
    (key) => !biodata || !biodata[key],
  );

  return {
    status: 200,
    body: {
      event,
      formVersion: {
        id: formVersion.id,
        version: formVersion.version,
        consentText: formVersion.consentText,
      },
      requestedProfileFields,
      missingProfileFields,
      questions,
      consentText: formVersion.consentText,
    },
  };
}
