import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

function isMusic(roleString) {
  return hasAnyRole(roleString, ["MUSIC", "DEVELOPER"]);
}

export async function GET() {
  let meta = await prisma.tuneTrackerMeta.findFirst();

  if (!meta) {
    meta = await prisma.tuneTrackerMeta.create({
      data: {
        curatedBy: "",
        editionDate: new Date(),
      },
    });
  }

  return NextResponse.json(meta);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { curatedBy, editionDate } = body;

  if (editionDate !== undefined) {
    const parsedDate = new Date(editionDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid editionDate format" },
        { status: 400 },
      );
    }
  }

  let meta = await prisma.tuneTrackerMeta.findFirst();

  const data = {};
  if (curatedBy !== undefined) data.curatedBy = curatedBy;
  if (editionDate !== undefined) data.editionDate = new Date(editionDate);

  if (meta) {
    meta = await prisma.tuneTrackerMeta.update({
      where: { id: meta.id },
      data,
    });
  } else {
    meta = await prisma.tuneTrackerMeta.create({
      data: {
        curatedBy: curatedBy || "",
        editionDate: editionDate ? new Date(editionDate) : new Date(),
      },
    });
  }

  return NextResponse.json(meta);
}
