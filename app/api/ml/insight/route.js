import { NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

const GEMINI_MODEL = process.env.INSIGHT_GEMINI_MODEL || "gemini-2.0-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const PROVIDER = (process.env.INSIGHT_MODEL_PROVIDER || "gemini").toLowerCase();

function isDeveloper(roleString) {
  return hasAnyRole(roleString, ["DEVELOPER"]);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !isDeveloper(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fail fast if provider key missing
  if (PROVIDER === "gemini" && !GEMINI_KEY) {
    return NextResponse.json(
      { error: "Missing Google Generative AI API key (GOOGLE_GENERATIVE_AI_API_KEY)" },
      { status: 500 },
    );
  }
  if (PROVIDER === "groq" && !GROQ_KEY) {
    return NextResponse.json(
      { error: "Missing Groq API key (GROQ_API_KEY)" },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.summary || typeof body.summary !== "object") {
    return NextResponse.json({ error: "summary object is required" }, { status: 400 });
  }

  const samples = Array.isArray(body.samples) ? body.samples : [];

  const lang = (body.language || "en").toLowerCase();

  const system =
    lang === "id"
      ? `Kamu adalah analis data konten blog untuk 8EH Radio ITB.
Buat insight singkat dan actionable dari ringkasan dataset yang diberikan.
Fokus pada korelasi sederhana antara fitur (title_length, content_length, has_image, tag_count, category) dan target read_count.
Jawab dalam 3-5 bullet, bahasa Indonesia, singkat, tanpa embel-embel berlebihan.`
      : `You are a blog content data analyst for 8EH Radio ITB.
Produce concise, actionable insights from the dataset summary.
Highlight simple correlations between features (title_length, content_length, has_image, tag_count, category) and the target read_count.
Answer in 3-5 bullets, English, concise, no fluff.`;

  const prompt =
    lang === "id"
      ? `Ringkasan dataset:
${JSON.stringify(body.summary, null, 2)}

Contoh sampel (maks 5):
${JSON.stringify(samples, null, 2)}

Buatkan insight yang berguna dan rekomendasi singkat.`
      : `Dataset summary:
${JSON.stringify(body.summary, null, 2)}

Sample rows (max 5):
${JSON.stringify(samples, null, 2)}

Provide useful insights and short recommendations.`;

  try {
    const model = PROVIDER === "groq" ? groq(GROQ_MODEL) : google(GEMINI_MODEL);

    const { text } = await generateText({
      model,
      system,
      prompt,
      maxTokens: 320,
      temperature: 0.4,
    });

    return NextResponse.json({ insights: text.trim() });
  } catch (error) {
    console.error("Gemini insight error:", error);
    return NextResponse.json(
      {
        error: "AI service error",
        detail: error?.message || error?.toString?.() || "",
      },
      { status: 502 },
    );
  }
}
