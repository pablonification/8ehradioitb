import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

const ML_API_BASE = process.env.ML_API_URL || "https://api.prediksi.my.id";

function isDeveloper(roleString) {
  return hasAnyRole(roleString, ["DEVELOPER"]);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !isDeveloper(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.content) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "Missing required field: content",
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${ML_API_BASE}/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: body.content,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("ML API Summarize Error:", error);
    return NextResponse.json(
      {
        error: "connection_failed",
        message: "Failed to connect to ML API",
      },
      { status: 503 },
    );
  }
}
