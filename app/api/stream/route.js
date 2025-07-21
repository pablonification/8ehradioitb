import { NextResponse } from "next/server";
import icy from "icy";
import { PassThrough } from "stream";

export const dynamic = 'force-dynamic';

export const runtime = "nodejs"; // ensure Node runtime (not edge) so we can use TCP sockets

export async function GET() {
  // Free-Shoutcast upstream URL
  const RADIO_URL = "https://s2.free-shoutcast.com/stream/18068/;stream.mp3";

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
          },
        });
        resolve(response);
      })
      .on("error", () => {
        resolve(new Response("Upstream error", { status: 502 }));
      });
  });
}
