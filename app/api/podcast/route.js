// File: app/api/podcast/route.js

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = 'force-dynamic';

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function isAdmin(roleString) {
  return hasAnyRole(roleString, ["DEVELOPER", "TECHNIC"]);
}

export async function GET() {
  try {
    const podcasts = await prisma.podcast.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(podcasts);
  } catch (error) {
    console.error("Error fetching podcasts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get("title");
    const subtitle = formData.get("subtitle");
    const description = formData.get("description");
    const audioFile = formData.get("audio");
    const coverImage = formData.get("coverImage");
    const date = formData.get("date");
    const duration = formData.get("duration");
    const image = formData.get("image");

    if (!title || !description || !audioFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const audioKey = `podcasts/${Date.now()}_${audioFile.name.replace(/\s/g, "_")}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: audioKey,
        Body: audioBuffer,
        ContentType: audioFile.type,
      }),
    );

    // Simpan hanya KEY-nya ke database
    const audioUrl = audioKey;

    let coverImageUrl = null;
    let coverImageKey = null;
    if (coverImage) {
      const coverBuffer = Buffer.from(await coverImage.arrayBuffer());
      coverImageKey = `podcasts/covers/${Date.now()}_${coverImage.name.replace(/\s/g, "_")}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: coverImageKey,
          Body: coverBuffer,
          ContentType: coverImage.type,
        }),
      );
      coverImageUrl = coverImageKey;
    }

    const podcast = await prisma.podcast.create({
      data: {
        title,
        subtitle: subtitle || undefined,
        description,
        date: date || undefined,
        duration: duration || undefined,
        audioUrl, // Menyimpan audioKey
        image:
          image ||
          (coverImageUrl ? `/api/proxy-audio?key=${coverImageUrl}` : undefined),
        coverImage: coverImageUrl
          ? `/api/proxy-audio?key=${coverImageUrl}`
          : undefined,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(podcast, { status: 201 });
  } catch (error) {
    console.error("Error creating podcast:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ... (Sisa kode PATCH dan DELETE tetap sama) ...
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, ...data } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing podcast id" },
        { status: 400 },
      );
    }
    const updated = await prisma.podcast.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating podcast:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing podcast id" },
        { status: 400 },
      );
    }
    await prisma.podcast.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting podcast:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
