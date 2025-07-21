import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isMusic(roleString) {
  return hasAnyRole(roleString, ["MUSIC", "DEVELOPER"]);
}

// GET: List all 10 entries, sorted by order
export async function GET() {
  const entries = await prisma.tuneTrackerEntry.findMany({
    orderBy: { order: "asc" },
  });
  const response = NextResponse.json(entries);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

// POST: Create or update one entry (by order)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { order, title, artist, coverImage, audioUrl } = await req.json();
  if (!order || !title || !artist) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  let entry = await prisma.tuneTrackerEntry.findFirst({ where: { order } });
  if (entry) {
    entry = await prisma.tuneTrackerEntry.update({
      where: { id: entry.id },
      data: { title, artist, coverImage, audioUrl },
    });
  } else {
    entry = await prisma.tuneTrackerEntry.create({
      data: { order, title, artist, coverImage, audioUrl },
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
  if (!id || !["coverImage", "audioUrl"].includes(field)) {
    return NextResponse.json({ error: "Missing id or invalid field" }, { status: 400 });
  }
  const entry = await prisma.tuneTrackerEntry.update({
    where: { id },
    data: { [field]: null },
  });
  return NextResponse.json(entry);
} 