import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { requireSession } from "@/lib/events/auth";
import { validationError } from "@/lib/events/contracts";
import { resolveParticipantEventForm } from "@/lib/events/formRead";

export async function GET(req, { params }) {
  void prisma;
  void authOptions;

  let session;
  try {
    const sessionResult = await requireSession(req);

    if (sessionResult && typeof sessionResult === "object") {
      if (sessionResult.errorResponse) {
        return sessionResult.errorResponse;
      }

      session = sessionResult.session || sessionResult;
    }
  } catch (error) {
    if (error?.status === 401) {
      return validationError("Unauthorized", null, 401);
    }

    console.error("Failed to resolve session for event form read:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }

  if (!session?.user?.id) {
    return validationError("Unauthorized", null, 401);
  }

  try {
    const { eventSlug } = await params;
    const result = await resolveParticipantEventForm(
      eventSlug,
      session.user.id,
    );
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Failed to read participant event form:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}
