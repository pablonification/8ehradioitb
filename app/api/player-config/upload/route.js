import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_DEV_URL = process.env.R2_PUBLIC_DEV_URL;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function isAdmin(role) {
  return ["DEVELOPER", "TECHNIC"].includes(role);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `player-covers/${Date.now()}_${file.name}`;
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read",
    }));
    const url = `${R2_PUBLIC_DEV_URL}/${key}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading to R2:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 