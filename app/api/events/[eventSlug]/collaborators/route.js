import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EVENT_ACTIONS,
  assertEventAction,
  requireSession,
} from "@/lib/events/auth";
import { reportCriticalError } from "@/lib/observability/critical";

const SHARE_LEVELS = new Set(["editor"]);

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeShareLevel(value) {
  if (typeof value !== "string") return "editor";
  const normalized = value.trim().toLowerCase();
  return SHARE_LEVELS.has(normalized) ? normalized : "editor";
}

function toCollaboratorResponse(item, ownerUserId) {
  const role =
    item.userId === ownerUserId
      ? "owner"
      : typeof item.role === "string" && item.role.trim()
        ? item.role.trim().toLowerCase()
        : "editor";

  return {
    id: item.id,
    userId: item.userId,
    role,
    createdAt: item.createdAt,
    user: item.user
      ? {
          id: item.user.id,
          name: item.user.name,
          email: item.user.email,
        }
      : null,
  };
}

async function getAuthorizedEvent(req, eventSlug, action) {
  const session = await requireSession(req);
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      slug: true,
      createdById: true,
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

  const authResponse = await assertEventAction(session.user.id, event.id, action);
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
    const { errorResponse, session, event } = await getAuthorizedEvent(
      req,
      params.eventSlug,
      EVENT_ACTIONS.COLLABORATOR_READ,
    );

    if (errorResponse) {
      return errorResponse;
    }

    const organizers = await prisma.eventOrganizer.findMany({
      where: {
        eventId: event.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const ownerAlreadyPresent = organizers.some(
      (item) => item.userId === event.createdById,
    );

    let merged = organizers;
    if (!ownerAlreadyPresent) {
      const ownerUser = await prisma.user.findUnique({
        where: { id: event.createdById },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (ownerUser) {
        merged = [
          {
            id: `owner-${ownerUser.id}`,
            userId: ownerUser.id,
            role: "owner",
            createdAt: null,
            user: ownerUser,
          },
          ...organizers,
        ];
      }
    }

    return NextResponse.json({
      canManage: session.user.id === event.createdById,
      items: merged.map((item) =>
        toCollaboratorResponse(item, event.createdById),
      ),
    });
  } catch (error) {
    if (error?.status) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    await reportCriticalError({
      source: "api/events/collaborators:get",
      message: "Failed to list collaborators",
      error,
      context: { eventSlug: params?.eventSlug || "" },
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req, { params }) {
  try {
    const { errorResponse, event } = await getAuthorizedEvent(
      req,
      params.eventSlug,
      EVENT_ACTIONS.COLLABORATOR_MANAGE,
    );

    if (errorResponse) {
      return errorResponse;
    }

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const shareLevel = normalizeShareLevel(body?.role);

    if (!email) {
      return NextResponse.json({ error: "email_required" }, { status: 400 });
    }

    const whitelisted = await prisma.whitelistedEmail.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (!whitelisted) {
      return NextResponse.json(
        { error: "email_not_whitelisted" },
        { status: 400 },
      );
    }

    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: "KRU",
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    }

    if (user.id === event.createdById) {
      return NextResponse.json(
        { error: "owner_is_implicit" },
        { status: 400 },
      );
    }

    const organizer = await prisma.eventOrganizer.upsert({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: user.id,
        },
      },
      update: {
        role: shareLevel,
      },
      create: {
        eventId: event.id,
        userId: user.id,
        role: shareLevel,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        item: toCollaboratorResponse(organizer, event.createdById),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error?.status) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    await reportCriticalError({
      source: "api/events/collaborators:post",
      message: "Failed to add collaborator",
      error,
      context: { eventSlug: params?.eventSlug || "" },
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const { errorResponse, event } = await getAuthorizedEvent(
      req,
      params.eventSlug,
      EVENT_ACTIONS.COLLABORATOR_MANAGE,
    );

    if (errorResponse) {
      return errorResponse;
    }

    const body = await req.json().catch(() => ({}));
    const organizerId = typeof body?.id === "string" ? body.id : "";
    const shareLevel = normalizeShareLevel(body?.role);

    if (!organizerId) {
      return NextResponse.json({ error: "id_required" }, { status: 400 });
    }

    const existing = await prisma.eventOrganizer.findUnique({
      where: {
        id: organizerId,
      },
      select: {
        id: true,
        eventId: true,
        userId: true,
      },
    });

    if (!existing || existing.eventId !== event.id) {
      return NextResponse.json(
        { error: "collaborator_not_found" },
        { status: 404 },
      );
    }

    if (existing.userId === event.createdById) {
      return NextResponse.json(
        { error: "cannot_change_owner_role" },
        { status: 400 },
      );
    }

    const updated = await prisma.eventOrganizer.update({
      where: {
        id: organizerId,
      },
      data: {
        role: shareLevel,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      item: toCollaboratorResponse(updated, event.createdById),
    });
  } catch (error) {
    if (error?.status) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    await reportCriticalError({
      source: "api/events/collaborators:patch",
      message: "Failed to update collaborator",
      error,
      context: { eventSlug: params?.eventSlug || "" },
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { errorResponse, event } = await getAuthorizedEvent(
      req,
      params.eventSlug,
      EVENT_ACTIONS.COLLABORATOR_MANAGE,
    );

    if (errorResponse) {
      return errorResponse;
    }

    const body = await req.json().catch(() => ({}));
    const organizerId = typeof body?.id === "string" ? body.id : "";
    if (!organizerId) {
      return NextResponse.json({ error: "id_required" }, { status: 400 });
    }

    const existing = await prisma.eventOrganizer.findUnique({
      where: {
        id: organizerId,
      },
      select: {
        id: true,
        eventId: true,
        userId: true,
      },
    });

    if (!existing || existing.eventId !== event.id) {
      return NextResponse.json(
        { error: "collaborator_not_found" },
        { status: 404 },
      );
    }

    if (existing.userId === event.createdById) {
      return NextResponse.json(
        { error: "cannot_remove_owner" },
        { status: 400 },
      );
    }

    await prisma.eventOrganizer.delete({
      where: {
        id: organizerId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error?.status) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    await reportCriticalError({
      source: "api/events/collaborators:delete",
      message: "Failed to remove collaborator",
      error,
      context: { eventSlug: params?.eventSlug || "" },
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
