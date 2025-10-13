import { NextResponse } from "next/server";
import icy from "icy";
import { PassThrough } from "stream";

export const runtime = "nodejs"; // ensure Node runtime (not edge) so we can use TCP sockets

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const streamUrl = searchParams.get('url');
  
  // Use provided URL or fallback to default
  const RADIO_URL = streamUrl || "https://s2.free-shoutcast.com/stream/18068/;stream.mp3";

  return new Promise((resolve) => {
    // Use icy to make request so it can handle shoutcast/ICY responses
    icy
      .get(RADIO_URL, (res) => {
        // res is a Node stream (IncomingMessage) with audio data in the body
        const pass = new PassThrough();
        res.pipe(pass);

        // Build response once headers received
        const response = new NextResponse(pass, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Range",
          },
        });
        resolve(response);
      })
      .on("error", (error) => {
        console.error("Stream proxy error:", error);
        resolve(new Response("Upstream error", { status: 502 }));
      });
  });
}
