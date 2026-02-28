import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const EVENT_ACTIONS = {
  FORM_EDIT: "form_edit",
  SUBMISSION_READ: "submission_read",
  EXPORT_RUN: "export_run",
  REGISTRATION_SUBMIT: "registration_submit",
};

const ORGANIZER_SCOPED_ACTIONS = new Set([
  EVENT_ACTIONS.FORM_EDIT,
  EVENT_ACTIONS.SUBMISSION_READ,
  EVENT_ACTIONS.EXPORT_RUN,
]);

export async function requireSession(req) {
  void req;
  const session = await getServerSession(authOptions);

  if (!session) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  return session;
}

export async function getSessionUser(req) {
  void req;
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

async function getEventOwnerId(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { createdById: true },
  });
  return event?.createdById ?? null;
}

export async function canPerformEventAction(userId, eventId, action) {
  if (action === EVENT_ACTIONS.REGISTRATION_SUBMIT) {
    if (!userId) {
      return { allowed: false, reason: "authentication_required" };
    }
    return { allowed: true, reason: "allowed" };
  }

  if (!ORGANIZER_SCOPED_ACTIONS.has(action)) {
    return { allowed: false, reason: "unknown_action" };
  }

  if (!userId) {
    return { allowed: false, reason: "authentication_required" };
  }

  if (!eventId) {
    return { allowed: false, reason: "missing_event_id" };
  }

  try {
    const ownerId = await getEventOwnerId(eventId);
    if (!ownerId) {
      return { allowed: false, reason: "event_not_found" };
    }

    if (ownerId === userId) {
      return { allowed: true, reason: "event_owner" };
    }

    return { allowed: false, reason: "not_event_owner" };
  } catch (error) {
    console.error("Error evaluating event action authorization:", error);
    return { allowed: false, reason: "db_unavailable" };
  }
}

export async function assertEventAction(userId, eventId, action) {
  const result = await canPerformEventAction(userId, eventId, action);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Forbidden", reason: result.reason },
      { status: 403 },
    );
  }

  return null;
}
