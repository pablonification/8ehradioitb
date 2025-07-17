import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// GET - Handle short link redirect and track analytics
export async function GET(req, { params }) {
  try {
    const { slug } = params;
    const headersList = headers();
    
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

    // Check if password is required
    if (shortLink.password) {
      // Redirect to password page
      return NextResponse.redirect(new URL(`/password/${slug}`, req.url));
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

// POST - Handle password-protected short link access
export async function POST(req, { params }) {
  try {
    const { slug } = params;
    const { password } = await req.json();
    const headersList = headers();
    
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

    // Check password
    if (shortLink.password && shortLink.password !== password) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    // Track the click
    await prisma.shortLinkClick.create({
      data: {
        shortLinkId: shortLink.id,
        ipAddress,
        userAgent,
        referer,
      }
    });

    // Redirect to destination
    return NextResponse.redirect(shortLink.destination);
  } catch (error) {
    console.error("Error handling password-protected redirect:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 