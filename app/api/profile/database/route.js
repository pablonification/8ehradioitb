import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hasAnyRole } from "@/lib/roleUtils";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasAnyRole(session.user.role, ["DATA", "DEVELOPER"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    const profiles = await prisma.participantProfile.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const filtered = query
      ? profiles.filter((profile) => {
          const biodata =
            profile.biodata &&
            typeof profile.biodata === "object" &&
            !Array.isArray(profile.biodata)
              ? profile.biodata
              : {};
          const candidates = [
            profile.displayName,
            profile.user?.name,
            profile.user?.email,
            biodata.fullName,
            biodata.nim,
          ]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase());

          return candidates.some((value) => value.includes(query));
        })
      : profiles;

    return NextResponse.json({
      total: filtered.length,
      items: filtered,
    });
  } catch (error) {
    console.error("Failed to list kru database:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
