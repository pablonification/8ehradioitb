import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_DEV_URL = process.env.R2_PUBLIC_DEV_URL;

const s3 =
  R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET
    ? new S3Client({
        region: "auto",
        endpoint: R2_ENDPOINT,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      })
    : null;

function safeDownloadName(name) {
  if (!name || typeof name !== "string") return "download";
  const cleaned = name
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "download";
}

export function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function normalizeR2ObjectKeys(keys = []) {
  if (!Array.isArray(keys)) return [];
  const unique = new Set();
  for (const key of keys) {
    if (typeof key !== "string") continue;
    const trimmed = key.trim();
    if (!trimmed || isHttpUrl(trimmed)) continue;
    unique.add(trimmed);
  }
  return Array.from(unique);
}

export async function resolveR2DownloadUrl(
  key,
  { expiresIn = 3600, forceDownload = true, fileName = "" } = {},
) {
  if (!key || typeof key !== "string") return "";
  if (isHttpUrl(key)) return key;

  if (s3) {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ...(forceDownload
          ? {
              ResponseContentDisposition: `attachment; filename="${safeDownloadName(fileName || key.split("/").pop() || "download")}"`,
            }
          : {}),
      });
      return await getSignedUrl(s3, command, { expiresIn });
    } catch (error) {
      console.warn("Failed to sign download URL, fallback to public URL", error);
    }
  }

  if (R2_PUBLIC_DEV_URL) {
    return `${R2_PUBLIC_DEV_URL}/${key}`;
  }

  return key;
}

export async function deleteR2ObjectKeys(keys = []) {
  const normalizedKeys = normalizeR2ObjectKeys(keys);
  if (!normalizedKeys.length || !s3 || !R2_BUCKET) return { deleted: 0, failed: [] };

  const failed = [];
  let deleted = 0;
  await Promise.all(
    normalizedKeys.map(async (key) => {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
          }),
        );
        deleted += 1;
      } catch (error) {
        failed.push({ key, error: error?.message || "delete_failed" });
      }
    }),
  );

  return { deleted, failed };
}
