import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  EVENT_ACTIONS,
  assertEventAction,
  requireSession,
} from "@/lib/events/auth";
import {
  getClosedMessage,
  getFormConfirmation,
  isFormClosed,
  isInternalAudience,
  isKruRole,
  normalizeFormSchema,
  RESPONSE_POLICIES,
} from "@/lib/forms/schema";
import {
  buildSubmissionSystemFields,
  canEditWithPolicy,
  findExistingSubmissionByIdentity,
  isSingleResponsePolicy,
  validateSubmissionAnswers,
} from "@/lib/forms/submission";

async function loadPublishedEventForm(eventSlug) {
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
      event: null,
      formVersion: null,
      schema: null,
      response: NextResponse.json({ error: "event_not_found" }, { status: 404 }),
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
  });

  if (!formVersion) {
    return {
      event,
      formVersion: null,
      schema: null,
      response: NextResponse.json(
        { error: "no_published_form" },
        { status: 404 },
      ),
    };
  }

  return {
    event,
    formVersion,
    schema: normalizeFormSchema(formVersion.formSchema),
    response: null,
  };
}

function buildProfileSnapshot(requestedProfileFields, biodata) {
  const snapshot = {};
  for (const fieldKey of requestedProfileFields) {
    snapshot[fieldKey] = biodata?.[fieldKey] ?? null;
  }
  return snapshot;
}

function getSessionIdentity(sessionUser, fallbackEmail) {
  return {
    userId: sessionUser?.id ?? null,
    email:
      typeof fallbackEmail === "string" && fallbackEmail.trim()
        ? fallbackEmail.trim().toLowerCase()
        : null,
  };
}

export async function GET(req, { params }) {
  try {
    const session = await requireSession(req);

    const event = await prisma.event.findUnique({
      where: {
        slug: params.eventSlug,
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const authResponse = await assertEventAction(
      session.user.id,
      event.id,
      EVENT_ACTIONS.SUBMISSION_READ,
    );

    if (authResponse) {
      return authResponse;
    }

    const submissions = await prisma.eventSubmission.findMany({
      where: { eventId: event.id },
      orderBy: {
        submittedAt: "desc",
      },
      select: {
        id: true,
        submitterUserId: true,
        participantProfileId: true,
        submittedAt: true,
        updatedAt: true,
        answers: true,
      },
    });

    return NextResponse.json({
      total: submissions.length,
      items: submissions,
    });
  } catch (error) {
    if (error?.status) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Failed to list submissions:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { event, formVersion, schema, response } = await loadPublishedEventForm(
      params.eventSlug,
    );

    if (response) {
      return response;
    }

    if (isFormClosed(schema)) {
      const closedMessage = getClosedMessage(schema);
      return NextResponse.json(
        {
          error: "form_closed",
          closedMessage,
        },
        { status: 409 },
      );
    }

    const body = await req.json();
    const answersInput = body?.answers;
    const consentAccepted = Boolean(body?.consentAccepted);
    const publicEmail = typeof body?.respondentEmail === "string" ? body.respondentEmail : "";

    const answerValidation = validateSubmissionAnswers(schema, answersInput);
    if (!answerValidation.valid) {
      return NextResponse.json(
        {
          error: "invalid_answers",
          details: answerValidation.errors,
        },
        { status: 400 },
      );
    }

    const systemPayload = buildSubmissionSystemFields({
      schema,
      sessionUser: session?.user,
      publicEmail,
      consentAccepted,
    });

    if (!systemPayload.valid) {
      return NextResponse.json(
        {
          error: "invalid_submission",
          details: systemPayload.errors,
        },
        { status: 400 },
      );
    }

    const isInternalForm = isInternalAudience(schema);
    let participantProfile = null;
    let biodata = null;

    if (isInternalForm) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "login_required" }, { status: 401 });
      }

      participantProfile = await prisma.participantProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          biodata: true,
        },
      });

      if (!participantProfile) {
        if (!session.user.role || isKruRole(session.user.role)) {
          return NextResponse.json(
            {
              error: "profile_required",
              setupUrl: "/profile/setup",
            },
            { status: 428 },
          );
        }

        return NextResponse.json({ error: "not_kru" }, { status: 403 });
      }

      biodata =
        participantProfile.biodata &&
        typeof participantProfile.biodata === "object" &&
        !Array.isArray(participantProfile.biodata)
          ? participantProfile.biodata
          : {};

      const missingRequestedFields = schema.requestedProfileFields.filter(
        (fieldKey) => !biodata[fieldKey],
      );

      if (missingRequestedFields.length > 0) {
        return NextResponse.json(
          {
            error: "profile_incomplete",
            missingFields: missingRequestedFields,
            setupUrl: "/profile/setup",
          },
          { status: 428 },
        );
      }

      if (schema.requestedProfileFields.length > 0 && !consentAccepted) {
        return NextResponse.json(
          {
            error: "consent_required",
            details: ["Anda harus menyetujui penggunaan data profil."],
          },
          { status: 400 },
        );
      }
    }

    const identity = getSessionIdentity(
      session?.user,
      systemPayload.system.respondentEmail,
    );

    let existingSubmission = null;
    if (isSingleResponsePolicy(schema.settings.responsePolicy)) {
      existingSubmission = await findExistingSubmissionByIdentity(event.id, identity);
    }

    if (
      existingSubmission &&
      schema.settings.responsePolicy === RESPONSE_POLICIES.SINGLE_NO_EDIT
    ) {
      return NextResponse.json(
        {
          error: "response_already_exists",
          submissionId: existingSubmission.id,
        },
        { status: 409 },
      );
    }

    const answers = {
      ...answerValidation.normalizedAnswers,
      _system: systemPayload.system,
    };

    const consentedProfileSnapshot = isInternalForm
      ? buildProfileSnapshot(schema.requestedProfileFields, biodata)
      : {};

    let submission;
    if (existingSubmission && canEditWithPolicy(schema.settings.responsePolicy)) {
      submission = await prisma.eventSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          answers,
          participantProfileId: participantProfile?.id ?? null,
          consentedProfileSnapshot,
          consentTextSnapshot: schema.consentText,
          consentVersion: formVersion.consentVersion,
          formSchemaSnapshot: schema,
          status: "updated",
        },
      });
    } else {
      submission = await prisma.eventSubmission.create({
        data: {
          eventId: event.id,
          formVersionId: formVersion.id,
          participantProfileId: participantProfile?.id ?? null,
          submitterUserId: session?.user?.id ?? null,
          status: "submitted",
          answers,
          formSchemaSnapshot: schema,
          consentedProfileSnapshot,
          consentTextSnapshot: schema.consentText,
          consentVersion: formVersion.consentVersion,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        submissionId: submission.id,
        confirmation: getFormConfirmation(schema),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to submit form response:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}
