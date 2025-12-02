import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { prisma } from "@/lib/prisma";
import {
  CHAT_SYSTEM_PROMPT,
  generateDynamicContext,
} from "@/lib/chatKnowledge";

// Rate limiting for public chat endpoint
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 messages per minute per IP

function getClientIP(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}

function checkRateLimit(clientId) {
  const now = Date.now();
  const clientRequests = rateLimitStore.get(clientId) || [];

  // Remove old requests outside the window
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
}, 60 * 1000); // Clean up every minute

export async function POST(req) {
  const clientIP = getClientIP(req);

  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    return new Response(
      JSON.stringify({
        error:
          "Wah, kamu terlalu cepat nih! Tunggu sebentar ya, coba lagi dalam 1 menit.",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get dynamic context from database (recent articles, podcasts)
    let systemPrompt = CHAT_SYSTEM_PROMPT;
    try {
      const dynamicContext = await generateDynamicContext(prisma);
      systemPrompt += dynamicContext;
    } catch (e) {
      console.error("Failed to get dynamic context:", e);
    }

    const result = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      maxTokens: 500,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Chat Error:", error);
    return new Response(
      JSON.stringify({
        error: "Ups, ada masalah nih. Coba lagi ya!",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
