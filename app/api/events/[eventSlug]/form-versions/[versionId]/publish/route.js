import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EVENT_ACTIONS,
  assertEventAction,
  requireSession,
} from "@/lib/events/auth";
import { validateFormSchema, validationError } from "@/lib/events/contracts";

function toFormVersionResponse(record) {
  const schema =
    record.formSchema && typeof record.formSchema === "object"
      ? record.formSchema
      : {};
  const requestedProfileFields = Array.isArray(schema.requestedProfileFields)
    ? schema.requestedProfileFields
    : [];
  const questions = Array.isArray(schema.questions) ? schema.questions : [];

  return {
    id: record.id,
    eventId: record.eventId,
    version: record.version,
    status: record.status,
    requestedProfileFields,
    questions,
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

  console.error(context, error);
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

    const schema =
      draft.formSchema && typeof draft.formSchema === "object"
        ? draft.formSchema
        : {};
    const requestedProfileFields = Array.isArray(schema.requestedProfileFields)
      ? schema.requestedProfileFields
      : [];
    const questions = Array.isArray(schema.questions) ? schema.questions : [];
    const consentText =
      typeof schema.consentText === "string" && schema.consentText.trim()
        ? schema.consentText.trim()
        : draft.consentText;

    const schemaValidation = await validateFormSchema({
      requestedProfileFields,
      questions,
    });

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
      const validatedSchemaSnapshot = {
        requestedProfileFields,
        questions,
        consentText,
      };

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
