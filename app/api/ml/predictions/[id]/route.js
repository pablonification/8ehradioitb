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
 * POST /api/ml/predictions/[id]
 * Proxy to ML Platform: POST /predictions/{model_id}
 * Generate predictions using a trained model
 *
 * Request body:
 * {
 *   input_data: array  // Array of objects (input rows without target column)
 * }
 */
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !isDeveloper(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.input_data ||
      !Array.isArray(body.input_data) ||
      body.input_data.length === 0
    ) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "input_data must be a non-empty array",
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${ML_API_BASE}/predictions/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_data: body.input_data,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("ML API Prediction Error:", error);
    return NextResponse.json(
      {
        error: "connection_failed",
        message: "Failed to connect to ML API",
      },
      { status: 503 },
    );
  }
}
