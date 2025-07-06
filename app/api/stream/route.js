import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime (not edge)

function buildPrimaryUrl() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000000);
  const sessionId = `s1_32559_stream_${random}`;
  const params = new URLSearchParams({
    typeportmount: sessionId,
    t: timestamp.toString(),
    _: Math.random().toString(36).slice(2, 11),
  });
  return `https://uk25freenew.listen2myradio.com/live.mp3?${params.toString()}`;
}

const FALLBACK_URLS = [
  "http://uk25freenew.listen2myradio.com:32559/",
  "http://uk25freenew.listen2myradio.com:8000/",
  "https://uk25freenew.listen2myradio.com:8000/",
  "http://uk25freenew.listen2myradio.com/live.mp3",
];

export async function GET() {
  console.log("[API/stream] Incoming request");
  // Helper to proxy a remote stream URL
  async function proxy(url) {
    console.log("[API/stream] Proxying to", url);
    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      throw new Error(`Upstream responded with ${upstream.status}`);
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    // Try HTTPS endpoint first (works in most environments)
    return await proxy(buildPrimaryUrl());
  } catch (err) {
    console.error("Primary upstream failed:", err.message);

    // Try all fallback URLs
    for (let i = 0; i < FALLBACK_URLS.length; i++) {
      const fallbackUrl = FALLBACK_URLS[i];
      console.log(
        `[API/stream] Trying fallback ${i + 1}/${FALLBACK_URLS.length}:`,
        fallbackUrl,
      );
      try {
        return await proxy(fallbackUrl);
      } catch (fallbackErr) {
        console.error(`Fallback ${i + 1} failed:`, fallbackErr.message);
      }
    }

    console.log("[API/stream] All upstream attempts failed");
    return new Response("All upstream sources unavailable", { status: 502 });
  }
}
