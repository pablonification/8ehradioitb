import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// GET - Handle short link redirect and track analytics
export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const headersList = await headers();
    const { searchParams } = new URL(req.url);
    const passwordParam = searchParams.get("password");
    
    // Get request information for analytics
    const userAgent = headersList.get("user-agent");
    const referer = headersList.get("referer");
    const forwarded = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwarded || realIp || "unknown";

    // Find the short link
    const shortLink = await prisma.shortLink.findUnique({
      where: { slug }
    });

    if (!shortLink) {
      // Redirect to 404 page
      return NextResponse.redirect(new URL('/not-found', req.url));
    }

    // Check if short link is active
    if (!shortLink.isActive) {
      return NextResponse.json(
        { error: "Short link is inactive" },
        { status: 410 }
      );
    }

    // Password protected logic
    if (shortLink.password) {
      if (!passwordParam || shortLink.password !== passwordParam) {
        // Redirect to password page
        return NextResponse.redirect(new URL(`/password/${slug}`, req.url));
      }
    }

    // Track the click
    await prisma.shortLinkClick.create({
      data: {
        shortLinkId: shortLink.id,
        ipAddress,
        userAgent,
        referer,
        // Note: Country and city would require a geolocation service
        // You can integrate with services like ipapi.co, ipinfo.io, etc.
      }
    });

    // Redirect to destination
    return NextResponse.redirect(shortLink.destination);
  } catch (error) {
    console.error("Error handling redirect:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 