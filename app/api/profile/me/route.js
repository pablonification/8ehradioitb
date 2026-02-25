import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function hasMeaningfulValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [profile, fields] = await Promise.all([
      prisma.participantProfile.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.profileFieldCatalog.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      profile,
      fields,
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const biodataInput =
      body?.biodata && typeof body.biodata === "object" && !Array.isArray(body.biodata)
        ? body.biodata
        : null;

    if (!biodataInput) {
      return NextResponse.json(
        { error: "biodata must be an object" },
        { status: 400 },
      );
    }

    const [currentProfile, requiredFields] = await Promise.all([
      prisma.participantProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          biodata: true,
        },
      }),
      prisma.profileFieldCatalog.findMany({
        where: {
          isActive: true,
          isRequired: true,
        },
        select: {
          key: true,
          label: true,
        },
      }),
    ]);

    const currentBiodata =
      currentProfile?.biodata &&
      typeof currentProfile.biodata === "object" &&
      !Array.isArray(currentProfile.biodata)
        ? currentProfile.biodata
        : {};

    const mergedBiodata = {
      ...currentBiodata,
      ...biodataInput,
    };

    const missingRequired = requiredFields
      .filter((field) => !hasMeaningfulValue(mergedBiodata[field.key]))
      .map((field) => field.key);

    if (missingRequired.length > 0 && body?.allowPartial !== true) {
      return NextResponse.json(
        {
          error: "missing_required_fields",
          missingFields: missingRequired,
        },
        { status: 400 },
      );
    }

    const displayName =
      typeof mergedBiodata.fullName === "string" && mergedBiodata.fullName.trim()
        ? mergedBiodata.fullName.trim()
        : session.user.name ?? null;

    const profile = await prisma.participantProfile.upsert({
      where: { userId: session.user.id },
      update: {
        displayName,
        biodata: mergedBiodata,
      },
      create: {
        userId: session.user.id,
        displayName,
        biodata: mergedBiodata,
      },
    });

    return NextResponse.json({
      ok: true,
      profile,
      missingFields: missingRequired,
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
