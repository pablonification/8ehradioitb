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

function parseISO8601Duration(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
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

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error("YOUTUBE_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch video metadata from YouTube" },
        { status: response.status },
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const item = data.items[0];
    const snippet = item.snippet;
    const contentDetails = item.contentDetails;

    const thumbnail =
      snippet.thumbnails.maxres ||
      snippet.thumbnails.high ||
      snippet.thumbnails.medium ||
      snippet.thumbnails.default;

    return NextResponse.json({
      title: snippet.title,
      thumbnailUrl: thumbnail ? thumbnail.url : "",
      videoId,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      duration: parseISO8601Duration(contentDetails.duration),
    });
  } catch (error) {
    console.error("Error fetching YouTube metadata:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
