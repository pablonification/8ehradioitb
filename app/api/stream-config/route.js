import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isAdmin(roleString) {
  return hasAnyRole(roleString, ["DEVELOPER", "TECHNIC"]);
}

export async function GET() {
  const config = await prisma.streamConfig.findFirst();
  const response = NextResponse.json(config || {});
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { baseUrls, defaultUrl, fallbackUrl, onAir } = await req.json();
  let config = await prisma.streamConfig.findFirst();
  if (config) {
    config = await prisma.streamConfig.update({
      where: { id: config.id },
      data: { baseUrls, defaultUrl, fallbackUrl, onAir },
    });
  } else {
    config = await prisma.streamConfig.create({
      data: { baseUrls, defaultUrl, fallbackUrl, onAir },
    });
  }
  const response = NextResponse.json(config);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
} 