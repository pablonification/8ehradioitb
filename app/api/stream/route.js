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

const FALLBACK_URL = "http://uk25freenew.listen2myradio.com:32559/";

export async function GET() {
  // Helper to proxy a remote stream URL
  async function proxy(url) {
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
    try {
      // Fallback to shoutcast port
      return await proxy(FALLBACK_URL);
    } catch (err2) {
      console.error("Fallback upstream failed:", err2.message);
      return new Response("Upstream error", { status: 502 });
    }
  }
}
