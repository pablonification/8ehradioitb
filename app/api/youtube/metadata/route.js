import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

function isMusic(roleString) {
  return hasAnyRole(roleString, ["MUSIC", "DEVELOPER"]);
}

function extractVideoId(input) {
  if (!input) return null;

  const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

  if (VIDEO_ID_REGEX.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);

    const allowedHosts = [
      "www.youtube.com",
      "youtube.com",
      "youtu.be",
      "m.youtube.com",
    ];
    if (!allowedHosts.includes(url.hostname)) {
      return null;
    }

    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.slice(1);
      return VIDEO_ID_REGEX.test(videoId) ? videoId : null;
    }

    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/shorts/")) {
        const videoId = url.pathname.split("/")[2];
        return VIDEO_ID_REGEX.test(videoId) ? videoId : null;
      }

      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        return VIDEO_ID_REGEX.test(videoId) ? videoId : null;
      }

      return null;
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, id } = body;

    if (!url && !id) {
      return NextResponse.json({ error: "Missing url or id" }, { status: 400 });
    }

    const videoId = extractVideoId(url || id);

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL or video ID" },
        { status: 400 },
      );
    }

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

    const response = await fetch(oembedUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Video not found or unavailable" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch video metadata" },
        { status: 502 },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      title: data.title,
      thumbnailUrl: data.thumbnail_url,
      videoId,
      canonicalUrl: watchUrl,
    });
  } catch (error) {
    console.error("Error fetching YouTube metadata:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
