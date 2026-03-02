import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

function isMusic(roleString) {
  return hasAnyRole(roleString, ["MUSIC", "DEVELOPER"]);
}

function toNonEmptyString(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed;
}

function normalizeTrackItem(track) {
  const trackId =
    typeof track?.trackId === "string" || typeof track?.trackId === "number"
      ? String(track.trackId).trim()
      : "";
  const title = toNonEmptyString(track?.trackName);
  const artist = toNonEmptyString(track?.artistName);

  // Skip partial rows so dashboard only offers entries that can be saved.
  if (!trackId || !title || !artist) return null;

  const album = toNonEmptyString(track?.collectionName);
  const artworkUrl100 = toNonEmptyString(track?.artworkUrl100);
  const previewUrl = toNonEmptyString(track?.previewUrl);
  const genre = toNonEmptyString(track?.primaryGenreName);
  const durationMs = Number.isFinite(track?.trackTimeMillis)
    ? track.trackTimeMillis
    : null;

  return {
    trackId,
    title,
    artist,
    album: album || null,
    // Scale artwork to 600x600 for better quality
    artworkUrl: artworkUrl100 ? artworkUrl100.replace("100x100bb", "600x600bb") : null,
    previewUrl: previewUrl || null,
    genre: genre || null,
    durationMs,
  };
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Missing search query" },
        { status: 400 },
      );
    }

    const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to search iTunes" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : null;

    if (!results) {
      console.error("Invalid iTunes response shape", { data });
      return NextResponse.json(
        { error: "Invalid iTunes response" },
        { status: 502 },
      );
    }

    const items = results
      .map((track) => normalizeTrackItem(track))
      .filter((item) => item !== null);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error searching iTunes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
