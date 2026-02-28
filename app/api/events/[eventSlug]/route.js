import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EVENT_ACTIONS,
  assertEventAction,
  requireSession,
} from "@/lib/events/auth";
import { validationError } from "@/lib/events/contracts";
import { reportCriticalError } from "@/lib/observability/critical";

function toEventResponse(event) {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    status: event.status,
    createdById: event.createdById,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
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
    source: "api/events/[eventSlug]",
    message: context,
    error,
  });
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function GET(req, { params }) {
  try {
    const session = await requireSession(req);

    const event = await prisma.event.findUnique({
      where: {
        slug: params.eventSlug,
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

    return NextResponse.json(toEventResponse(event));
  } catch (error) {
    return handleRouteError(error, "Error fetching event:");
  }
}

export async function PATCH(req, { params }) {
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

    const body = await req.json();
    const expectedUpdatedAt =
      typeof body?.expectedUpdatedAt === "string" && body.expectedUpdatedAt.trim()
        ? new Date(body.expectedUpdatedAt)
        : null;

    if (expectedUpdatedAt && Number.isNaN(expectedUpdatedAt.getTime())) {
      return validationError(
        "Invalid payload",
        ["expectedUpdatedAt must be a valid ISO datetime string"],
        400,
      );
    }

    if (expectedUpdatedAt) {
      const currentEvent = await prisma.event.findUnique({
        where: { id: event.id },
        select: { updatedAt: true },
      });
      if (!currentEvent) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      if (currentEvent.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        return NextResponse.json(
          {
            error: "stale_event_metadata",
            currentUpdatedAt: currentEvent.updatedAt,
          },
          { status: 409 },
        );
      }
    }
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(body, "title")) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return validationError(
          "Invalid payload",
          ["title must be a non-empty string when provided"],
          400,
        );
      }
      updates.title = body.title.trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, "description")) {
      if (
        body.description !== null &&
        (typeof body.description !== "string" || !body.description.trim())
      ) {
        return validationError(
          "Invalid payload",
          ["description must be null or a non-empty string when provided"],
          400,
        );
      }

      updates.description =
        typeof body.description === "string" ? body.description.trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return validationError(
        "Invalid payload",
        ["At least one of title or description is required"],
        400,
      );
    }

    const updated = await prisma.event.update({
      where: {
        id: event.id,
      },
      data: updates,
    });

    return NextResponse.json(toEventResponse(updated));
  } catch (error) {
    return handleRouteError(error, "Error updating event:");
  }
}

export async function DELETE(req, { params }) {
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
      EVENT_ACTIONS.EVENT_DELETE,
    );

    if (authResponse) {
      return authResponse;
    }

    // MongoDB has no cascade deletes — manually delete related records in order.
    await prisma.eventExportLog.deleteMany({ where: { eventId: event.id } });
    await prisma.eventSubmission.deleteMany({ where: { eventId: event.id } });
    await prisma.eventFormVersion.deleteMany({ where: { eventId: event.id } });
    await prisma.eventOrganizer.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Error deleting event:");
  }
}
