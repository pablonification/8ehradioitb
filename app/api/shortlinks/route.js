import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { nanoid } from "nanoid";

// Generate a unique slug
async function generateUniqueSlug() {
  let slug;
  let isUnique = false;
  
  while (!isUnique) {
    slug = nanoid(8); // Generate 8 character slug
    const existing = await prisma.shortLink.findUnique({
      where: { slug }
    });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return slug;
}

// GET - Fetch all short links for the authenticated user
export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shortLinks = await prisma.shortLink.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            clicks: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(shortLinks);
  } catch (error) {
    console.error("Error fetching short links:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Create a new short link
export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { destination, title, slug: customSlug, password } = await req.json();

    if (!destination) {
      return NextResponse.json(
        { error: "Destination URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(destination);
    } catch {
      return NextResponse.json(
        { error: "Invalid destination URL format" },
        { status: 400 }
      );
    }

    let finalSlug = customSlug;

    // If custom slug is provided, check if it's unique
    if (customSlug) {
      const existing = await prisma.shortLink.findUnique({
        where: { slug: customSlug }
      });
      
      if (existing) {
        return NextResponse.json(
          { error: "Custom back-half already exists" },
          { status: 409 }
        );
      }
    } else {
      // Generate auto slug if no custom slug provided
      finalSlug = await generateUniqueSlug();
    }

    const shortLink = await prisma.shortLink.create({
      data: {
        destination,
        title: title || null,
        slug: finalSlug,
        password: password || null,
        userId: session.user.id
      }
    });

    return NextResponse.json(shortLink, { status: 201 });
  } catch (error) {
    console.error("Error creating short link:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT - Update a short link
export async function PUT(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, destination, title, slug: newSlug, password, isActive } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Short link ID is required" },
        { status: 400 }
      );
    }

    // Check if the short link belongs to the user
    const existingShortLink = await prisma.shortLink.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingShortLink) {
      return NextResponse.json(
        { error: "Short link not found" },
        { status: 404 }
      );
    }

    // If new slug is provided and different from current, check uniqueness
    if (newSlug && newSlug !== existingShortLink.slug) {
      const slugExists = await prisma.shortLink.findUnique({
        where: { slug: newSlug }
      });
      
      if (slugExists) {
        return NextResponse.json(
          { error: "Custom back-half already exists" },
          { status: 409 }
        );
      }
    }

    // Validate URL format if destination is being updated
    if (destination) {
      try {
        new URL(destination);
      } catch {
        return NextResponse.json(
          { error: "Invalid destination URL format" },
          { status: 400 }
        );
      }
    }

    const updatedShortLink = await prisma.shortLink.update({
      where: { id },
      data: {
        destination: destination || undefined,
        title: title !== undefined ? title : undefined,
        slug: newSlug || undefined,
        password: password !== undefined ? password : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    return NextResponse.json(updatedShortLink);
  } catch (error) {
    console.error("Error updating short link:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 