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

  void reportCriticalError({
    source: "api/events/form-versions/publish",
    message: context,
    error,
  });
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function POST(req, { params }) {
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
      EVENT_ACTIONS.FORM_EDIT,
    );

    if (authResponse) {
      return authResponse;
    }

    const draft = await prisma.eventFormVersion.findFirst({
      where: {
        id: params.versionId,
        eventId: event.id,
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Form version not found" },
        { status: 404 },
      );
    }

    if (draft.status === "published") {
      return NextResponse.json(
        { error: "Form version already published" },
        { status: 409 },
      );
    }

    const schema = normalizeFormSchema(draft.formSchema);
    const consentText =
      typeof schema.consentText === "string" && schema.consentText.trim()
        ? schema.consentText.trim()
        : draft.consentText;

    const schemaValidation = await validateFormSchema(schema);

    if (!schemaValidation.valid) {
      return validationError(
        "Invalid form schema",
        schemaValidation.errors,
        400,
      );
    }

    const published = await prisma.$transaction(async (tx) => {
      const latestPublished = await tx.eventFormVersion.findFirst({
        where: {
          eventId: event.id,
          status: "published",
        },
        orderBy: {
          version: "desc",
        },
        select: {
          version: true,
        },
      });

      const nextVersion = (latestPublished?.version ?? 0) + 1;
      const validatedSchemaSnapshot = schemaValidation.normalized;

      const publishedRecord = await tx.eventFormVersion.create({
        data: {
          eventId: event.id,
          version: nextVersion,
          status: "published",
          formSchema: validatedSchemaSnapshot,
          consentText,
          consentVersion: `v${nextVersion}`,
          publishedAt: new Date(),
          createdById: session.user.id,
        },
      });

      await tx.eventFormVersion.delete({
        where: {
          id: draft.id,
        },
      });

      return publishedRecord;
    });

    return NextResponse.json(toFormVersionResponse(published), { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Error publishing event form version:");
  }
}
