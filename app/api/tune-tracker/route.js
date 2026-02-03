import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

function isMusic(roleString) {
  return hasAnyRole(roleString, ["MUSIC", "DEVELOPER"]);
}

function validateYoutubeFields(videoId, start, end, url) {
  if (videoId && !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return "Invalid youtubeVideoId format (must be 11 characters alphanumeric + -_)";
  }
  if (start !== undefined && start !== null) {
    const s = parseInt(start);
    if (isNaN(s) || s < 0) {
      return "startSeconds must be >= 0";
    }
  }
  if (
    start !== undefined &&
    end !== undefined &&
    start !== null &&
    end !== null
  ) {
    const s = parseInt(start);
    const e = parseInt(end);
    if (!isNaN(s) && !isNaN(e) && e <= s) {
      return "endSeconds must be > startSeconds";
    }
  }
  if (url) {
    try {
      const u = new URL(url);
      if (
        !u.hostname.includes("youtube.com") &&
        !u.hostname.includes("youtu.be")
      ) {
        return "youtubeUrl host must be YouTube";
      }
    } catch (e) {
      return "Invalid youtubeUrl format";
    }
  }
  return null;
}

// GET: List all 10 entries, sorted by order
export async function GET() {
  const entries = await prisma.tuneTrackerEntry.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(entries);
}

// POST: Create or update one entry (by order)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    order,
    title,
    artist,
    coverImage,
    audioUrl,
    youtubeUrl,
    youtubeVideoId,
    startSeconds,
    endSeconds,
    sourceType,
  } = body;

  if (!order || !title || !artist) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  let mode = sourceType;
  if (!mode) {
    if (youtubeVideoId) mode = "YOUTUBE";
    else if (audioUrl) mode = "AUDIO_URL";
    else
      return NextResponse.json(
        { error: "Must provide either audioUrl or youtubeVideoId" },
        { status: 400 },
      );
  }

  if (mode === "YOUTUBE") {
    if (!youtubeVideoId)
      return NextResponse.json(
        { error: "Missing youtubeVideoId for YOUTUBE mode" },
        { status: 400 },
      );
    if (startSeconds === undefined || startSeconds === null)
      return NextResponse.json(
        { error: "Missing startSeconds for YOUTUBE mode" },
        { status: 400 },
      );
    if (endSeconds === undefined || endSeconds === null)
      return NextResponse.json(
        { error: "Missing endSeconds for YOUTUBE mode" },
        { status: 400 },
      );

    const error = validateYoutubeFields(
      youtubeVideoId,
      startSeconds,
      endSeconds,
      youtubeUrl,
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
  } else if (mode === "AUDIO_URL") {
    if (!audioUrl)
      return NextResponse.json(
        { error: "Missing audioUrl for AUDIO_URL mode" },
        { status: 400 },
      );
  } else {
    return NextResponse.json({ error: "Invalid sourceType" }, { status: 400 });
  }

  const data = {
    title,
    artist,
    coverImage,
    audioUrl,
    youtubeUrl,
    youtubeVideoId,
    startSeconds:
      startSeconds !== undefined && startSeconds !== null
        ? parseInt(startSeconds)
        : null,
    endSeconds:
      endSeconds !== undefined && endSeconds !== null
        ? parseInt(endSeconds)
        : null,
    sourceType: mode,
  };

  let entry = await prisma.tuneTrackerEntry.findFirst({ where: { order } });
  if (entry) {
    entry = await prisma.tuneTrackerEntry.update({
      where: { id: entry.id },
      data,
    });
  } else {
    entry = await prisma.tuneTrackerEntry.create({
      data: { order, ...data },
    });
  }
  return NextResponse.json(entry);
}

// PATCH: Partial update (by id)
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (
    data.youtubeVideoId ||
    data.startSeconds !== undefined ||
    data.endSeconds !== undefined ||
    data.youtubeUrl
  ) {
    const current = await prisma.tuneTrackerEntry.findUnique({
      where: { id },
    });
    if (!current)
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const mergedStart =
      data.startSeconds !== undefined
        ? data.startSeconds
        : current.startSeconds;
    const mergedEnd =
      data.endSeconds !== undefined ? data.endSeconds : current.endSeconds;
    const mergedVideoId =
      data.youtubeVideoId !== undefined
        ? data.youtubeVideoId
        : current.youtubeVideoId;
    const mergedUrl =
      data.youtubeUrl !== undefined ? data.youtubeUrl : current.youtubeUrl;

    const error = validateYoutubeFields(
      mergedVideoId,
      mergedStart,
      mergedEnd,
      mergedUrl,
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  const entry = await prisma.tuneTrackerEntry.update({ where: { id }, data });
  return NextResponse.json(entry);
}

// DELETE: Remove cover or audio from entry (by id, field)
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, field } = await req.json();
  if (
    !id ||
    !["coverImage", "audioUrl", "youtubeUrl", "youtubeVideoId"].includes(field)
  ) {
    return NextResponse.json(
      { error: "Missing id or invalid field" },
      { status: 400 },
    );
  }
  const entry = await prisma.tuneTrackerEntry.update({
    where: { id },
    data: { [field]: null },
  });
  return NextResponse.json(entry);
}
