import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

const ML_API_BASE =
  process.env.ML_API_URL ||
  "https://ml-powered-prediction-platform.up.railway.app";

function isDeveloper(roleString) {
  return hasAnyRole(roleString, ["DEVELOPER"]);
}

/**
 * GET /api/ml/health
 * Proxy to ML Platform: GET /health
 * Returns API health status
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isDeveloper(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${ML_API_BASE}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("ML API Health Check Error:", error);
    return NextResponse.json(
      {
        error: "connection_failed",
        message: "Failed to connect to ML API",
        status: "offline",
      },
      { status: 503 },
    );
  }
}
