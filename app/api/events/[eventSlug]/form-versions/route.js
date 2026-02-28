import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EVENT_ACTIONS,
  assertEventAction,
  requireSession,
} from "@/lib/events/auth";
import { validateFormSchema, validationError } from "@/lib/events/contracts";
import { normalizeFormSchema } from "@/lib/forms/schema";
import { reportCriticalError } from "@/lib/observability/critical";

function toFormVersionResponse(record) {
  const schema = normalizeFormSchema(record.formSchema);

  return {
    id: record.id,
    eventId: record.eventId,
    version: record.version,
    status: record.status,
    requestedProfileFields: schema.requestedProfileFields,
    sections: schema.sections,
    questions: schema.questions,
    settings: schema.settings,
    confirmation: schema.confirmation,
    consentText: record.consentText,
    consentVersion: record.consentVersion,
    formSchemaSnapshot: record.status === "published" ? schema : null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    publishedAt: record.publishedAt,
  };
}

function handleRouteError(error, context) {
  if (error?.status) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  if (error?.code === "P2002") {
    return NextResponse.json(
      { error: "Draft already exists for this event" },
      { status: 409 },
    );
  }

  void reportCriticalError({
    source: "api/events/form-versions",
    message: context,
    error,
  });
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

async function getAuthorizedEvent(req, eventSlug) {
  const session = await requireSession(req);
  const event = await prisma.event.findUnique({
    where: {
      slug: eventSlug,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!event) {
    return {
      errorResponse: NextResponse.json(
        { error: "Event not found" },
        { status: 404 },
      ),
      session,
      event: null,
    };
  }

  const authResponse = await assertEventAction(
    session.user.id,
    event.id,
    EVENT_ACTIONS.FORM_EDIT,
  );

  if (authResponse) {
    return {
      errorResponse: authResponse,
      session,
      event,
    };
  }

  return {
    errorResponse: null,
    session,
    event,
  };
}

export async function GET(req, { params }) {
  try {
    const { errorResponse, event } = await getAuthorizedEvent(
      req,
      params.eventSlug,
    );

    if (errorResponse) {
      return errorResponse;
    }

    const versions = await prisma.eventFormVersion.findMany({
      where: {
        eventId: event.id,
      },
      orderBy: [
        {
          version: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return NextResponse.json(versions.map(toFormVersionResponse));
  } catch (error) {
    return handleRouteError(error, "Error listing event form versions:");
  }
}

export async function POST(req, { params }) {
  try {
    const { errorResponse, event, session } = await getAuthorizedEvent(
      req,
      params.eventSlug,
    );

    if (errorResponse) {
      return errorResponse;
    }

    const body = await req.json();
    const requestedProfileFields = body?.requestedProfileFields;
    const sections = body?.sections;
    const questions = body?.questions;
    const settings = body?.settings;
    const confirmation = body?.confirmation;
    const baseDraftId =
      typeof body?.baseDraftId === "string" && body.baseDraftId.trim()
        ? body.baseDraftId.trim()
        : null;
    const consentText =
      typeof body?.consentText === "string" ? body.consentText.trim() : "";

    if (!consentText) {
      return validationError(
        "Invalid payload",
        ["consentText is required and must be a non-empty string"],
        400,
      );
    }

    const schemaValidation = await validateFormSchema({
      requestedProfileFields,
      sections,
      questions,
      settings,
      confirmation,
      consentText,
    });

    if (!schemaValidation.valid) {
      return validationError(
        "Invalid form schema",
        schemaValidation.errors,
        400,
      );
    }

    const currentDraft = await prisma.eventFormVersion.findFirst({
      where: {
        eventId: event.id,
        status: "draft",
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    if (
      (baseDraftId && (!currentDraft || currentDraft.id !== baseDraftId)) ||
      (!baseDraftId && currentDraft)
    ) {
      return NextResponse.json(
        {
          error: "stale_draft_version",
          currentDraftId: currentDraft?.id || null,
          currentDraftUpdatedAt: currentDraft?.updatedAt || null,
        },
        { status: 409 },
      );
    }

    await prisma.eventFormVersion.deleteMany({
      where: {
        eventId: event.id,
        status: "draft",
      },
    });

    const draft = await prisma.eventFormVersion.create({
      data: {
        eventId: event.id,
        version: 0,
        status: "draft",
        formSchema: schemaValidation.normalized,
        consentText,
        consentVersion: "draft",
        createdById: session.user.id,
      },
    });

    return NextResponse.json(toFormVersionResponse(draft), { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Error creating event form draft:");
  }
}
