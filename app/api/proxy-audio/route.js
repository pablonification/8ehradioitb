// File: app/api/proxy-audio/route.js

import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

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

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  let key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "File key is missing" }, { status: 400 });
  }

  // If a full URL is passed, extract only the pathname (object key)
  if (key.startsWith('http')) {
    try {
      const url = new URL(key);
      key = url.pathname.substring(1);
    } catch (e) {
      console.error("Invalid URL passed as key:", key);
      return NextResponse.json({ error: "Invalid key format" }, { status: 400 });
    }
  }

  // NEW: Allow keys that were mistakenly prefixed with our API route, e.g. "/api/podcast/podcasts/xyz.mp3"
  // Strip the leading "/api/podcast/" segment (with or without the initial slash)
  key = key.replace(/^\/?api\/podcast\//, "");

  // Ensure no leading slash remains before sending to R2
  if (key.startsWith('/')) {
    key = key.substring(1);
  }

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });
    const s3Response = await s3.send(command);

    if (!s3Response.Body || typeof s3Response.Body.transformToWebStream !== 'function') {
      throw new Error("S3 response body is not a readable stream.");
    }

    const body = s3Response.Body.transformToWebStream();
    const headers = new Headers();
    headers.set("Content-Type", s3Response.ContentType || "application/octet-stream");
    headers.set("Content-Length", s3Response.ContentLength?.toString() || '0');
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Accept-Ranges", "bytes");

    return new NextResponse(body, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error(`Error fetching from R2 for key ${key}:`, error);
    if (error.name === 'NoSuchKey') {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}