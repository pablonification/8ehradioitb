import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/roleUtils";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = 'force-dynamic';

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

function isMusic(roleString) {
  return hasAnyRole(roleString, ["MUSIC", "DEVELOPER"]);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const type = formData.get("type"); // "cover" or "audio"
    if (!file || !type) {
      return NextResponse.json({ error: "No file or type provided" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop();
    const key = `tune-tracker/${type}s/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read",
    }));
    return NextResponse.json({ key });
  } catch (error) {
    console.error("Error uploading to R2:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 