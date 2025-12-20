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

    if (!body.platform || !body.title || !body.description) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "Missing required fields: platform, title, description",
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${ML_API_BASE}/content/social-caption`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform: body.platform,
        title: body.title,
        description: body.description,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("ML API Social Caption Error:", error);
    return NextResponse.json(
      {
        error: "connection_failed",
        message: "Failed to connect to ML API",
      },
      { status: 503 },
    );
  }
}
