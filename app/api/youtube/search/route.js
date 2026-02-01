import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

function isMusic(roleString) {
  return hasAnyRole(roleString, ["MUSIC", "DEVELOPER"]);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Missing search query" },
        { status: 400 },
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${apiKey}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to search YouTube" },
        { status: response.status },
      );
    }

    const data = await response.json();

    const items = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
