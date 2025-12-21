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
 * POST /api/ml/training
 * Proxy to ML Platform: POST /training
 * Starts async model training
 *
 * Request body:
 * {
 *   id: string,           // Unique model identifier
 *   target_col: string,   // Target column name
 *   training_data: array  // Array of objects (CSV rows)
 * }
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !isDeveloper(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.id || !body.target_col || !body.training_data) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "Missing required fields: id, target_col, training_data",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.training_data) || body.training_data.length < 10) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "training_data must be an array with at least 10 items",
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${ML_API_BASE}/training`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: body.id,
        target_col: body.target_col,
        training_data: body.training_data,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("ML API Training Error:", error);
    return NextResponse.json(
      {
        error: "connection_failed",
        message: "Failed to connect to ML API",
      },
      { status: 503 },
    );
  }
}
