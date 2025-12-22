import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

function isDeveloper(roleString) {
  return hasAnyRole(roleString, ["DEVELOPER"]);
}

/**
 * Dummy Data Generator for ML Training
 *
 * Scenarios:
 * 1. listener_engagement - Predict if listener will return
 * 2. podcast_popularity - Predict if podcast episode will be popular
 * 3. chart_movement - Predict song's next chart position
 */

const SCENARIOS = {
  listener_engagement: {
    name: "Listener Engagement",
    description: "Predict whether a listener will return to the radio station",
    target_col: "will_return",
    model_type: "classification",
    features: [
      { name: "age", type: "int", min: 15, max: 60 },
      { name: "hours_listened", type: "float", min: 0, max: 50 },
      { name: "days_active", type: "int", min: 1, max: 30 },
      { name: "favorite_genre", type: "category", values: [0, 1, 2, 3, 4] }, // encoded: pop, rock, jazz, electronic, hiphop
    ],
    generateTarget: (row) => {
      // Higher hours & days = more likely to return
      const score =
        (row.hours_listened / 50) * 0.4 +
        (row.days_active / 30) * 0.4 +
        (row.age > 20 && row.age < 40 ? 0.2 : 0);
      return Math.random() < score ? 1 : 0;
    },
  },
  podcast_popularity: {
    name: "Podcast Popularity",
    description: "Predict whether a podcast episode will be popular",
    target_col: "is_popular",
    model_type: "classification",
    features: [
      { name: "duration_mins", type: "int", min: 10, max: 120 },
      { name: "num_tags", type: "int", min: 1, max: 10 },
      { name: "publish_hour", type: "int", min: 0, max: 23 },
      { name: "host_experience_years", type: "int", min: 0, max: 10 },
    ],
    generateTarget: (row) => {
      // Sweet spot duration (30-60 mins), more tags, prime time (17-21), experienced host
      const durationScore =
        row.duration_mins >= 30 && row.duration_mins <= 60 ? 0.3 : 0.1;
      const tagScore = (row.num_tags / 10) * 0.2;
      const timeScore =
        row.publish_hour >= 17 && row.publish_hour <= 21 ? 0.25 : 0.1;
      const expScore = (row.host_experience_years / 10) * 0.25;
      return Math.random() < durationScore + tagScore + timeScore + expScore
        ? 1
        : 0;
    },
  },
  chart_movement: {
    name: "Chart Movement",
    description: "Predict a song's next position in the chart (regression)",
    target_col: "next_position",
    model_type: "regression",
    features: [
      { name: "current_position", type: "int", min: 1, max: 100 },
      { name: "weeks_on_chart", type: "int", min: 1, max: 52 },
      { name: "genre_popularity", type: "float", min: 0, max: 1 },
      { name: "social_mentions", type: "int", min: 0, max: 10000 },
    ],
    generateTarget: (row) => {
      // Songs with high social mentions and genre popularity tend to rise
      const momentum =
        (row.social_mentions / 10000) * 0.5 + row.genre_popularity * 0.3;
      const fatigue = Math.min(row.weeks_on_chart / 52, 0.5); // longer on chart = tends to fall
      const change = Math.round(
        (momentum - fatigue) * 20 + (Math.random() - 0.5) * 10,
      );
      const newPosition = Math.max(
        1,
        Math.min(100, row.current_position - change),
      );
      return newPosition;
    },
  },
};

function generateRandomValue(feature) {
  switch (feature.type) {
    case "int":
      return (
        Math.floor(Math.random() * (feature.max - feature.min + 1)) +
        feature.min
      );
    case "float":
      return (
        Math.round(
          (Math.random() * (feature.max - feature.min) + feature.min) * 100,
        ) / 100
      );
    case "category":
      return feature.values[Math.floor(Math.random() * feature.values.length)];
    default:
      return 0;
  }
}

function generateDataset(scenario, sampleSize) {
  const config = SCENARIOS[scenario];
  if (!config) {
    return null;
  }

  const data = [];
  for (let i = 0; i < sampleSize; i++) {
    const row = {};

    // Generate feature values
    for (const feature of config.features) {
      row[feature.name] = generateRandomValue(feature);
    }

    // Generate target value
    row[config.target_col] = config.generateTarget(row);

    data.push(row);
  }

  return {
    scenario: scenario,
    name: config.name,
    description: config.description,
    target_col: config.target_col,
    model_type: config.model_type,
    features: config.features.map((f) => f.name),
    sample_size: sampleSize,
    data: data,
  };
}

/**
 * GET /api/ml/generate-dummy
 * Returns available scenarios
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isDeveloper(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scenarios = Object.entries(SCENARIOS).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
    target_col: value.target_col,
    model_type: value.model_type,
    features: value.features.map((f) => ({
      name: f.name,
      type: f.type,
      min: f.min,
      max: f.max,
      values: f.values,
    })),
  }));

  return NextResponse.json({ scenarios });
}

/**
 * POST /api/ml/generate-dummy
 * Generate dummy training data
 *
 * Request body:
 * {
 *   scenario: string,     // "listener_engagement" | "podcast_popularity" | "chart_movement"
 *   sample_size: number   // 10-500
 * }
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !isDeveloper(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const { scenario, sample_size = 100 } = body;

    // Validate scenario
    if (!scenario || !SCENARIOS[scenario]) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: `Invalid scenario. Available: ${Object.keys(SCENARIOS).join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate sample size
    const size = Math.min(Math.max(parseInt(sample_size) || 100, 10), 500);

    const result = generateDataset(scenario, size);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate Dummy Data Error:", error);
    return NextResponse.json(
      {
        error: "generation_failed",
        message: "Failed to generate dummy data",
      },
      { status: 500 },
    );
  }
}
