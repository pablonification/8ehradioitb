import { NextResponse } from "next/server";
import { requireSession } from "@/lib/events/auth";
import { validationError } from "@/lib/events/contracts";
import { submitRegistration } from "@/lib/events/submit";

function toAuthErrorResponse(error) {
  if (error?.status === 401) {
    return NextResponse.json(error.body ?? { error: "Unauthorized" }, {
      status: 401,
    });
  }

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export async function POST(req, { params }) {
  let session;
  const { eventSlug } = await params;
  try {
    session = await requireSession(req);
  } catch (error) {
    return toAuthErrorResponse(error);
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return validationError(
      "Invalid payload",
      ["Request body must be valid JSON"],
      400,
    );
  }

  return handleRegistrationPost(eventSlug, session.user.id, body);
}

export async function handleRegistrationPost(eventSlug, userId, body) {
  try {
    const missingProfileFields = body?.missingProfileFields;
    const answers = body?.answers;
    const consent = body?.consent;

    if (consent?.granted !== true) {
      return NextResponse.json({ error: "consent_required" }, { status: 400 });
    }

    const result = await submitRegistration(eventSlug, userId, {
      missingProfileFields,
      answers,
      consent,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error?.code === "already_submitted") {
      return NextResponse.json({ error: "already_submitted" }, { status: 409 });
    }

    if (error?.status === 404) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error?.status === 400) {
      return validationError(
        error.message || "Invalid payload",
        Array.isArray(error.details) ? error.details : null,
        400,
      );
    }

    console.error("Error creating event registration submission:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
