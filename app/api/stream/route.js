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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  // If mode=embed, return iframe HTML instead of stream
  if (mode === "embed") {
    const embedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>8EH Radio Stream</title>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial; background: #000; color: #fff; }
    audio { width: 100%; max-width: 400px; }
    .status { margin-top: 10px; font-size: 12px; color: #ccc; }
  </style>
</head>
<body>
  <h3>8EH Radio ITB - Live Stream</h3>
  <audio id="player" controls autoplay preload="none">
    <source src="https://uk25freenew.listen2myradio.com/live.mp3" type="audio/mpeg">
    <source src="http://uk25freenew.listen2myradio.com:32559/" type="audio/mpeg">
    <source src="https://uk25freenew.listen2myradio.com:8000/" type="audio/mpeg">
    Your browser does not support the audio element.
  </audio>
  <div class="status">
    <p>Status: <span id="status">Loading...</span></p>
    <p>Current Source: <span id="current-src">None</span></p>
  </div>
  
  <script>
    const audio = document.getElementById('player');
    const status = document.getElementById('status');
    const currentSrc = document.getElementById('current-src');
    
    const sources = [
      'https://uk25freenew.listen2myradio.com/live.mp3?' + Date.now(),
      'http://uk25freenew.listen2myradio.com:32559/?' + Date.now(),
      'https://uk25freenew.listen2myradio.com:8000/?' + Date.now()
    ];
    let currentIndex = 0;
    
    function tryNextSource() {
      if (currentIndex < sources.length) {
        const src = sources[currentIndex];
        audio.src = src;
        currentSrc.textContent = src;
        status.textContent = 'Trying source ' + (currentIndex + 1) + '...';
        currentIndex++;
        audio.load();
        audio.play().catch(() => {
          setTimeout(tryNextSource, 2000);
        });
      } else {
        status.textContent = 'All sources failed';
      }
    }
    
    audio.addEventListener('error', () => {
      status.textContent = 'Error on current source, trying next...';
      setTimeout(tryNextSource, 1000);
    });
    
    audio.addEventListener('loadstart', () => {
      status.textContent = 'Loading...';
    });
    
    audio.addEventListener('canplay', () => {
      status.textContent = 'Ready to play';
    });
    
    audio.addEventListener('playing', () => {
      status.textContent = 'Playing';
    });
    
    // Start with first source
    tryNextSource();
  </script>
</body>
</html>`;

    return new Response(embedHtml, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
      },
    });
  }

  console.log("[API/stream] Incoming request");
  // Helper to proxy a remote stream URL
  async function proxy(url) {
    console.log("[API/stream] Proxying to", url);

    // Mimic browser headers to bypass ISP/CDN blocks
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "identity",
      Range: "bytes=0-",
      Referer: "https://8ehradioitb.radio12345.com/",
      Origin: "https://8ehradioitb.radio12345.com",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    };

    const upstream = await fetch(url, {
      cache: "no-store",
      headers,
      redirect: "follow",
    });
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
