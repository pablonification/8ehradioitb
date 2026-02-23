import { NextResponse } from "next/server";
import {
  EVENT_ACTIONS,
  assertEventAction,
  requireSession,
} from "@/lib/events/auth";
import { prisma } from "@/lib/prisma";

function normalizeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function pickConsentedProfileSnapshot(submission) {
  const schema = normalizeObject(submission.formSchemaSnapshot);
  const requestedFields = Array.isArray(schema.requestedProfileFields)
    ? schema.requestedProfileFields.filter((field) => typeof field === "string")
    : [];

  const rawSnapshot = normalizeObject(submission.consentedProfileSnapshot);

  if (requestedFields.length === 0) {
    return {};
  }

  return requestedFields.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(rawSnapshot, key)) {
      result[key] = rawSnapshot[key];
    }

    return result;
  }, {});
}

function toSubmissionResponse(submission) {
  return {
    id: submission.id,
    status: submission.status,
    submittedAt: submission.submittedAt,
    consentVersion: submission.consentVersion,
    profileSnapshot: pickConsentedProfileSnapshot(submission),
    answers: normalizeObject(submission.answers),
    submitter: submission.submitterUser
      ? {
          id: submission.submitterUser.id,
          name: submission.submitterUser.name,
          email: submission.submitterUser.email,
        }
      : null,
  };
}

function handleRouteError(error, context) {
  if (error?.status) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  console.error(context, error);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function GET(req, { params }) {
  try {
    const { eventSlug } = await params;
    const session = await requireSession(req);

    const event = await prisma.event.findUnique({
      where: {
        slug: eventSlug,
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
      where: {
        eventId: event.id,
      },
      orderBy: {
        submittedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        consentVersion: true,
        answers: true,
        consentedProfileSnapshot: true,
        formSchemaSnapshot: true,
        submitterUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      submissions: submissions.map(toSubmissionResponse),
    });
  } catch (error) {
    return handleRouteError(error, "Error listing event submissions:");
  }
}
