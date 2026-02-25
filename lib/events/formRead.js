import { prisma } from "@/lib/prisma";
import {
  getClosedMessage,
  getFormConfirmation,
  isFormClosed,
  isInternalAudience,
  isKruRole,
  normalizeFormSchema,
  RESPONSE_POLICIES,
} from "@/lib/forms/schema";
import { getMissingRequiredProfileKeys } from "@/lib/profile/database";

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

function normalizeUserContext(userContextOrId) {
  if (!userContextOrId) {
    return { userId: null, role: null, email: null };
  }

  if (typeof userContextOrId === "string") {
    return { userId: userContextOrId, role: null, email: null };
  }

  if (typeof userContextOrId === "object") {
    return {
      userId:
        typeof userContextOrId.userId === "string"
          ? userContextOrId.userId
          : null,
      role:
        typeof userContextOrId.role === "string" ? userContextOrId.role : null,
      email:
        typeof userContextOrId.email === "string"
          ? userContextOrId.email
          : null,
    };
  }

  return { userId: null, role: null, email: null };
}

export async function resolveParticipantEventForm(eventSlug, userContextOrId) {
  const userContext = normalizeUserContext(userContextOrId);
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
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

  const normalizedSchema = normalizeFormSchema(formVersion.formSchema);
  const isInternalForm = isInternalAudience(normalizedSchema);

  if (isInternalForm && !userContext.userId) {
    return {
      status: 401,
      body: { error: "login_required" },
    };
  }

  const participantProfile = userContext.userId
    ? await prisma.participantProfile.findUnique({
        where: { userId: userContext.userId },
        select: { id: true, biodata: true },
      })
    : null;

  const biodata =
    participantProfile &&
    participantProfile.biodata &&
    typeof participantProfile.biodata === "object" &&
    !Array.isArray(participantProfile.biodata)
      ? participantProfile.biodata
      : null;

  if (isInternalForm && !participantProfile) {
    if (userContext.role === null || isKruRole(userContext.role)) {
      return {
        status: 428,
        body: {
          error: "profile_required",
          setupUrl: "/profile/setup",
        },
      };
    }

    return {
      status: 403,
      body: { error: "not_kru" },
    };
  }

  const activeRequiredFields = isInternalForm
    ? await prisma.profileFieldCatalog.findMany({
        where: {
          isActive: true,
          isRequired: true,
        },
        select: {
          key: true,
          label: true,
        },
      })
    : [];

  const missingMasterRequiredFields = isInternalForm
    ? getMissingRequiredProfileKeys({
        biodata,
        requiredFieldKeys: activeRequiredFields.map((field) => field.key),
      })
    : [];

  if (isInternalForm && missingMasterRequiredFields.length > 0) {
    return {
      status: 428,
      body: {
        error: "profile_incomplete",
        setupUrl: "/profile/setup",
        missingFields: missingMasterRequiredFields,
        missingFieldLabels: activeRequiredFields
          .filter((field) => missingMasterRequiredFields.includes(field.key))
          .map((field) => field.label || field.key),
      },
    };
  }

  const requestedKeys = isInternalForm
    ? normalizeRequestedKeys(normalizedSchema)
    : [];
  const questions = normalizeQuestions(normalizedSchema);

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

  const existingSubmission =
    userContext.userId &&
    normalizedSchema.settings.responsePolicy ===
      RESPONSE_POLICIES.SINGLE_WITH_EDIT
      ? await prisma.eventSubmission.findFirst({
          where: {
            eventId: event.id,
            submitterUserId: userContext.userId,
          },
          orderBy: {
            submittedAt: "desc",
          },
          select: {
            id: true,
            answers: true,
            submittedAt: true,
            updatedAt: true,
          },
        })
      : null;

  const closed = isFormClosed(normalizedSchema);
  const closedMessage = getClosedMessage(normalizedSchema);

  return {
    status: 200,
    body: {
      event,
      formVersion: {
        id: formVersion.id,
        version: formVersion.version,
        consentText: formVersion.consentText,
      },
      schema: normalizedSchema,
      requestedProfileFields,
      missingProfileFields,
      consentPreviewValues: buildProfileSnapshot(requestedKeys, biodata),
      questions,
      consentText: formVersion.consentText,
      sections: normalizedSchema.sections,
      settings: normalizedSchema.settings,
      confirmation: getFormConfirmation(normalizedSchema),
      audienceMode: normalizedSchema.settings.audienceMode,
      isClosed: closed,
      closedMessage,
      existingSubmission,
    },
  };
}

function buildProfileSnapshot(requestedKeys, biodata) {
  const snapshot = {};
  for (const key of requestedKeys) {
    snapshot[key] = biodata?.[key] ?? null;
  }
  return snapshot;
}
