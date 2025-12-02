import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

// Rate limiting for public TL;DR endpoint
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per IP

function getClientIP(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}

function checkRateLimit(clientId) {
  const now = Date.now();
  const clientRequests = rateLimitStore.get(clientId) || [];

  const recentRequests = clientRequests.filter(
    (time) => now - time < RATE_LIMIT_WINDOW,
  );

  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }

  recentRequests.push(now);
  rateLimitStore.set(clientId, recentRequests);
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, requests] of rateLimitStore.entries()) {
    const recentRequests = requests.filter(
      (time) => now - time < RATE_LIMIT_WINDOW,
    );
    if (recentRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, recentRequests);
    }
  }
}, 60 * 1000);

export async function POST(req) {
  const clientIP = getClientIP(req);

  if (!checkRateLimit(clientIP)) {
    return new Response(
      JSON.stringify({
        error: "Terlalu banyak permintaan. Coba lagi dalam 1 menit.",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { content, title } = await req.json();

    if (!content || content.length < 200) {
      return new Response(
        JSON.stringify({
          error: "Konten terlalu pendek untuk dirangkum",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `Kamu adalah asisten yang membantu merangkum artikel berita/blog dari 8EH Radio ITB.

TUGAS:
Buat ringkasan TL;DR (Too Long; Didn't Read) yang padat dan informatif.

ATURAN:
- Gunakan bahasa Indonesia yang casual tapi tetap informatif
- Buat dalam format 2-4 bullet points
- Setiap bullet point maksimal 1-2 kalimat
- Fokus pada poin-poin utama dan informasi penting
- Jangan gunakan kata "TL;DR" di output
- Output HANYA bullet points, tanpa pengantar atau penutup
- Format: gunakan "•" untuk bullet points`,
      prompt: `Judul: ${title || "Artikel"}\n\nKonten:\n${content.substring(0, 4000)}`,
      maxTokens: 300,
      temperature: 0.3,
    });

    return new Response(JSON.stringify({ summary: text.trim() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI TL;DR Error:", error);
    return new Response(
      JSON.stringify({ error: "Gagal membuat ringkasan. Coba lagi nanti." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
