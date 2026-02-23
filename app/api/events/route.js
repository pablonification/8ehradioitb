import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hasAnyRole } from "@/lib/roleUtils";
import {
  EVENT_ACTIONS,
  assertEventAction,
  requireSession,
} from "@/lib/events/auth";
import { validationError } from "@/lib/events/contracts";

const DEVELOPER_CHECK_EVENT_ID = "000000000000000000000000";

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

  if (error?.code === "P2002" && error?.meta?.target?.includes("slug")) {
    return NextResponse.json(
      { error: "Event slug must be unique" },
      { status: 409 },
    );
  }

  console.error(context, error);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function GET(req) {
  try {
    const session = await requireSession(req);

    const isDeveloper = hasAnyRole(session.user.role, ["DEVELOPER"]);
    const events = await prisma.event.findMany({
      where: isDeveloper
        ? undefined
        : {
            organizers: {
              some: {
                userId: session.user.id,
              },
            },
          },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(events.map(toEventResponse));
  } catch (error) {
    return handleRouteError(error, "Error listing events:");
  }
}

export async function POST(req) {
  try {
    const session =
      (await getServerSession(authOptions)) ?? (await requireSession(req));

    const authResponse = await assertEventAction(
      session.user.id,
      DEVELOPER_CHECK_EVENT_ID,
      EVENT_ACTIONS.FORM_EDIT,
    );

    if (authResponse) {
      return authResponse;
    }

    if (!hasAnyRole(session.user.role, ["DEVELOPER"])) {
      return NextResponse.json(
        { error: "Forbidden", reason: "developer_required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : null;

    if (!slug || !title) {
      return validationError(
        "Invalid payload",
        ["slug and title are required and must be non-empty strings"],
        400,
      );
    }

    const event = await prisma.event.create({
      data: {
        slug,
        title,
        description,
        createdById: session.user.id,
        organizers: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
      },
    });

    return NextResponse.json(toEventResponse(event), { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Error creating event:");
  }
}
