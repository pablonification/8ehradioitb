import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  getPhoneFieldKeySet,
  normalizeBiodataPhones,
  normalizePhoneTo62,
} from "../lib/profile/phone.js";

const prisma = new PrismaClient();

const ROOT = process.cwd();
const DEFAULT_CSV_PATH = path.join(ROOT, "public", "database.csv");
const ENV_PATH = path.join(ROOT, ".env");

function loadEnvFile(filePath) {
  try {
    const raw = readFileSync(filePath, "utf8");
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex < 1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      if (process.env[key] !== undefined) continue;

      let value = trimmed.slice(eqIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // no-op if .env is not readable
  }
}

loadEnvFile(ENV_PATH);

const FIELD_MAP = [
  {
    header: "NAMA LENGKAP",
    key: "fullName",
    label: "NAMA LENGKAP",
    fieldType: "text",
    isRequired: true,
  },
  {
    header: "EMAIL",
    key: "email",
    label: "EMAIL",
    fieldType: "email",
    isRequired: true,
  },
  {
    header: "TANGGAL LAHIR",
    key: "birthDate",
    label: "TANGGAL LAHIR",
    fieldType: "date",
    isRequired: true,
  },
  {
    header: "F/S-PRODI",
    key: "facultyMajor",
    label: "F/S-PRODI",
    fieldType: "text",
    isRequired: true,
  },
  {
    header: "NIM",
    key: "nim",
    label: "NIM",
    fieldType: "text",
    isRequired: true,
  },
  {
    header: "ON AIR/BA",
    key: "division",
    label: "ON AIR/BA",
    fieldType: "text",
    isRequired: true,
  },
  {
    header: "KTM",
    key: "ktmFile",
    label: "KTM",
    fieldType: "file",
    isRequired: true,
  },
  {
    header: "TTD",
    key: "signatureFile",
    label: "TTD",
    fieldType: "file",
    isRequired: true,
  },
  {
    header: "NO.HP",
    key: "activePhone",
    label: "NO.HP",
    fieldType: "phone",
    isRequired: true,
  },
  {
    header: "ID LINE",
    key: "lineId",
    label: "ID LINE",
    fieldType: "text",
    isRequired: true,
  },
  {
    header: "NO.HP DARURAT",
    key: "emergencyPhone",
    label: "NO.HP DARURAT",
    fieldType: "phone",
    isRequired: true,
  },
  {
    header: "PEMILIK NO. DARURAT",
    key: "emergencyContactRelation",
    label: "PEMILIK NO. DARURAT",
    fieldType: "text",
    isRequired: true,
  },
  {
    header: "ALAMAT RUMAH",
    key: "originAddress",
    label: "ALAMAT RUMAH",
    fieldType: "textarea",
    isRequired: true,
  },
  {
    header: "ALAMAT SAAT INI",
    key: "itbAddress",
    label: "ALAMAT SAAT INI",
    fieldType: "textarea",
    isRequired: true,
  },
  {
    header: "FOTO",
    key: "bestPhotoFile",
    label: "FOTO",
    fieldType: "file",
    isRequired: true,
  },
];

const FILE_FIELD_KEYS = new Set(
  FIELD_MAP.filter((item) => item.fieldType === "file").map((item) => item.key),
);

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;

const GOOGLE_DRIVE_ACCESS_TOKEN =
  process.env.GOOGLE_DRIVE_ACCESS_TOKEN || process.env.GOOGLE_ACCESS_TOKEN;
const GOOGLE_OAUTH_CLIENT_ID =
  process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_OAUTH_CLIENT_SECRET =
  process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_OAUTH_REFRESH_TOKEN =
  process.env.GOOGLE_OAUTH_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

const R2_READY = Boolean(
  R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET,
);

const s3 = R2_READY
  ? new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

let cachedGoogleToken = {
  value: GOOGLE_DRIVE_ACCESS_TOKEN || "",
  expiresAt: GOOGLE_DRIVE_ACCESS_TOKEN ? Date.now() + 30 * 60 * 1000 : 0,
};

function parseArgs(argv) {
  return {
    execute: argv.includes("--execute"),
    uploadFiles: !argv.includes("--skip-file-upload"),
    createMissingUsers: !argv.includes("--skip-create-missing-users"),
    csvPath: (() => {
      const csvArg = argv.find((item) => item.startsWith("--csv="));
      if (!csvArg) return DEFAULT_CSV_PATH;
      const raw = csvArg.slice("--csv=".length).trim();
      if (!raw) return DEFAULT_CSV_PATH;
      return path.isAbsolute(raw) ? raw : path.join(ROOT, raw);
    })(),
    limit: (() => {
      const limitArg = argv.find((item) => item.startsWith("--limit="));
      if (!limitArg) return null;
      const parsed = Number(limitArg.split("=")[1]);
      if (!Number.isFinite(parsed) || parsed < 1) return null;
      return Math.floor(parsed);
    })(),
  };
}

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "-") return "";
  return normalized;
}

function isPlausibleEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function sanitizeSegment(value) {
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function extractDriveFileId(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";

  try {
    const parsed = new URL(rawUrl.trim());
    const idFromQuery = parsed.searchParams.get("id");
    if (idFromQuery) return idFromQuery;

    const directMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (directMatch?.[1]) return directMatch[1];
  } catch {
    return "";
  }

  return "";
}

function buildDriveDownloadUrl(rawUrl) {
  const id = extractDriveFileId(rawUrl);
  if (!id) return rawUrl;
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

function inferExtensionFromMime(contentType) {
  const mime = String(contentType || "").toLowerCase();
  if (mime.includes("pdf")) return ".pdf";
  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg")) return ".jpg";
  if (mime.includes("jpg")) return ".jpg";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  if (mime.includes("zip")) return ".zip";
  if (mime.includes("json")) return ".json";
  return "";
}

function parseFileNameFromContentDisposition(contentDisposition) {
  const value = String(contentDisposition || "");
  const star = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (star?.[1]) return decodeURIComponent(star[1]);

  const basic = value.match(/filename="?([^";]+)"?/i);
  if (basic?.[1]) return basic[1];

  return "";
}

function normalizeDateValue(value) {
  function excelSerialToIsoDate(serialValue) {
    const serial = Number(serialValue);
    if (!Number.isFinite(serial)) return "";
    if (serial < 1000 || serial > 100000) return "";

    const parsed = XLSX.SSF.parse_date_code(serial);
    if (!parsed || !parsed.y || !parsed.m || !parsed.d) return "";

    return `${String(parsed.y).padStart(4, "0")}-${String(parsed.m).padStart(
      2,
      "0",
    )}-${String(parsed.d).padStart(2, "0")}`;
  }

  if (typeof value === "number") {
    const fromSerial = excelSerialToIsoDate(value);
    if (fromSerial) return fromSerial;
  }

  const raw = normalizeText(value);
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const fromSerial = excelSerialToIsoDate(raw);
    if (fromSerial) return fromSerial;
  }

  const parts = raw.split(/[/-]/).map((item) => item.trim());
  if (parts.length !== 3) return raw;

  let day = Number(parts[0]);
  let month = Number(parts[1]);
  let year = Number(parts[2]);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return raw;
  }

  if (year < 100) year += 2000;

  if (day > 12 && month <= 12) {
    // dd/mm/yyyy
  } else if (month > 12 && day <= 12) {
    // mm/dd/yyyy -> swap
    [day, month] = [month, day];
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
    return raw;
  }

  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

async function requestGoogleAccessTokenFromRefreshToken() {
  if (
    !GOOGLE_OAUTH_CLIENT_ID ||
    !GOOGLE_OAUTH_CLIENT_SECRET ||
    !GOOGLE_OAUTH_REFRESH_TOKEN
  ) {
    return "";
  }

  const body = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
    refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`google_token_refresh_failed_${response.status}`);
  }

  const payload = await response.json();
  const accessToken =
    typeof payload?.access_token === "string" ? payload.access_token : "";
  const expiresIn = Number(payload?.expires_in || 3600);
  if (!accessToken) throw new Error("google_token_refresh_missing_access_token");

  cachedGoogleToken = {
    value: accessToken,
    expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000,
  };

  return accessToken;
}

async function getGoogleDriveAccessToken() {
  if (cachedGoogleToken.value && Date.now() < cachedGoogleToken.expiresAt) {
    return cachedGoogleToken.value;
  }
  return requestGoogleAccessTokenFromRefreshToken();
}

async function fetchDriveBinaryWithAuth(fileId) {
  const token = await getGoogleDriveAccessToken();
  if (!token) throw new Error("google_drive_auth_not_configured");

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId,
    )}?alt=media&supportsAllDrives=true`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      redirect: "follow",
    },
  );

  if (!response.ok) {
    throw new Error(`drive_api_download_failed_${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    data: Buffer.from(arrayBuffer),
    contentType: response.headers.get("content-type") || "",
    contentDisposition: response.headers.get("content-disposition") || "",
    finalUrl: response.url || "",
  };
}

async function fetchBinaryWithDriveFallback(rawUrl) {
  const fileId = extractDriveFileId(rawUrl);
  let authError = null;
  if (fileId) {
    try {
      return await fetchDriveBinaryWithAuth(fileId);
    } catch (error) {
      authError = error;
    }
  }

  const firstUrl = buildDriveDownloadUrl(rawUrl);
  let response = await fetch(firstUrl, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(`download_failed_${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) {
    const arrayBuffer = await response.arrayBuffer();
    return {
      data: Buffer.from(arrayBuffer),
      contentType,
      contentDisposition: response.headers.get("content-disposition") || "",
      finalUrl: response.url || firstUrl,
    };
  }

  // Some Drive files need confirm token.
  const html = await response.text();
  const id = extractDriveFileId(rawUrl);
  const confirmMatch = html.match(/confirm=([0-9A-Za-z_-]+)/);
  if (!id || !confirmMatch?.[1]) {
    if (authError) {
      throw new Error(
        `drive_auth_failed_then_public_failed:${authError.message}:drive_confirm_token_missing`,
      );
    }
    throw new Error("drive_confirm_token_missing");
  }

  const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${id}`;
  response = await fetch(confirmUrl, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(`download_failed_${response.status}`);
  }

  const secondType = response.headers.get("content-type") || "";
  if (secondType.toLowerCase().includes("text/html")) {
    if (authError) {
      throw new Error(
        `drive_auth_failed_then_public_failed:${authError.message}:drive_still_html_response`,
      );
    }
    throw new Error("drive_still_html_response");
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    data: Buffer.from(arrayBuffer),
    contentType: secondType,
    contentDisposition: response.headers.get("content-disposition") || "",
    finalUrl: response.url || confirmUrl,
  };
}

async function uploadBinaryToR2({ userId, fieldKey, originalUrl, contentType, data, fileName }) {
  if (!s3) throw new Error("r2_not_configured");
  const safeName = sanitizeSegment(fileName || "file");
  const extFromName = path.extname(safeName);
  const ext = extFromName || inferExtensionFromMime(contentType) || "";
  const finalFileName = extFromName ? safeName : `${safeName}${ext}`;
  const key = `kru-profile/${userId}/${fieldKey}/migration_${Date.now()}_${finalFileName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: data,
    ContentType: contentType || "application/octet-stream",
    Metadata: {
      source: "database_csv_migration",
      original_url: sanitizeSegment(originalUrl).slice(0, 200),
    },
  });

  await s3.send(command);
  return key;
}

async function ensureCatalogMatchesCsv() {
  const existing = await prisma.profileFieldCatalog.findMany({
    orderBy: { createdAt: "asc" },
  });
  const existingByKey = new Map(existing.map((field) => [field.key, field]));
  const csvKeys = new Set(FIELD_MAP.map((item) => item.key));

  let created = 0;
  let updated = 0;
  let deactivated = 0;

  for (const field of FIELD_MAP) {
    const data = {
      label: field.label,
      description: `Field hasil migrasi master CSV (${field.header}).`,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      isActive: true,
      options: null,
      metadata:
        field.fieldType === "file"
          ? { source: "database.csv", maxSizeMB: 10 }
          : {},
    };

    if (!existingByKey.has(field.key)) {
      await prisma.profileFieldCatalog.create({
        data: {
          key: field.key,
          ...data,
        },
      });
      created += 1;
    } else {
      const current = existingByKey.get(field.key);
      const needsUpdate =
        current.label !== data.label ||
        current.description !== data.description ||
        current.fieldType !== data.fieldType ||
        Boolean(current.isRequired) !== Boolean(data.isRequired) ||
        Boolean(current.isActive) !== true;

      if (needsUpdate) {
        await prisma.profileFieldCatalog.update({
          where: { id: current.id },
          data,
        });
        updated += 1;
      }
    }
  }

  for (const field of existing) {
    if (csvKeys.has(field.key)) continue;
    if (!field.isActive && !field.isRequired) continue;

    await prisma.profileFieldCatalog.update({
      where: { id: field.id },
      data: {
        isActive: false,
        isRequired: false,
      },
    });
    deactivated += 1;
  }

  return { created, updated, deactivated };
}

function loadRowsFromCsv(csvPath) {
  const workbook = XLSX.readFile(csvPath, { raw: false, cellDates: false });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  const worksheet = workbook.Sheets[firstSheet];
  return XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
  });
}

async function migrateRow({
  row,
  execute,
  uploadFiles,
  createMissingUsers,
  index,
}) {
  const rawEmail = normalizeText(row.EMAIL || row["EMAIL"]);
  const email = normalizeEmail(rawEmail);

  if (!email) {
    return {
      status: "skipped_missing_email",
      index,
      email: "",
      reason: "missing_email",
    };
  }

  if (!isPlausibleEmail(email)) {
    return {
      status: "skipped_invalid_email",
      index,
      email,
      reason: "invalid_email_format",
    };
  }

  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });
  let createdUser = false;
  let whitelistedEmailEnsured = false;

  if (!user) {
    if (!createMissingUsers) {
      return {
        status: "skipped_email_not_found",
        index,
        email,
        reason: "user_not_found",
      };
    }

    const suggestedName = normalizeText(row["NAMA LENGKAP"]) || null;
    if (!execute) {
      createdUser = true;
      whitelistedEmailEnsured = true;
      user = {
        id: `dry_run_user_${index + 1}`,
        email,
        name: suggestedName,
      };
    } else {
      const createdOrExistingUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: suggestedName,
          role: "KRU",
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
      user = createdOrExistingUser;
      createdUser = true;
    }
  }

  if (execute) {
    await prisma.whitelistedEmail.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    whitelistedEmailEnsured = true;
  }

  const existingProfile =
    createdUser && !execute
      ? null
      : await prisma.participantProfile.findUnique({
          where: { userId: user.id },
          select: { id: true, biodata: true },
        });

  const baseBiodata =
    existingProfile?.biodata &&
    typeof existingProfile.biodata === "object" &&
    !Array.isArray(existingProfile.biodata)
      ? existingProfile.biodata
      : {};

  const nextBiodata = { ...baseBiodata };
  const fileUploads = [];
  const uploadErrors = [];

  for (const field of FIELD_MAP) {
    const rawValue = normalizeText(row[field.header]);
    if (!rawValue) continue;

    if (!FILE_FIELD_KEYS.has(field.key)) {
      nextBiodata[field.key] =
        field.key === "birthDate"
          ? normalizeDateValue(rawValue)
          : field.fieldType === "phone"
            ? normalizePhoneTo62(rawValue)
            : rawValue;
      continue;
    }

    if (!uploadFiles) {
      nextBiodata[field.key] = rawValue;
      continue;
    }

    if (!execute) {
      nextBiodata[field.key] = rawValue;
      fileUploads.push({
        fieldKey: field.key,
        mode: "dry_run_skip_upload",
      });
      continue;
    }

    try {
      const downloaded = await fetchBinaryWithDriveFallback(rawValue);
      const dispositionName = parseFileNameFromContentDisposition(
        downloaded.contentDisposition,
      );
      const fileNameFromUrl = path.basename(
        new URL(downloaded.finalUrl).pathname || "",
      );
      const fallbackName = `${field.key}_${index + 1}`;
      const chosenName =
        sanitizeSegment(dispositionName) ||
        sanitizeSegment(fileNameFromUrl) ||
        fallbackName;

      const uploadedKey = await uploadBinaryToR2({
        userId: user.id,
        fieldKey: field.key,
        originalUrl: rawValue,
        contentType: downloaded.contentType,
        data: downloaded.data,
        fileName: chosenName,
      });

      nextBiodata[field.key] = uploadedKey;
      fileUploads.push({
        fieldKey: field.key,
        mode: "uploaded",
        key: uploadedKey,
      });
    } catch (error) {
      uploadErrors.push({
        fieldKey: field.key,
        url: rawValue,
        error: error instanceof Error ? error.message : String(error),
      });
      // Keep original URL so data is not lost.
      nextBiodata[field.key] = rawValue;
    }
  }

  const displayName =
    typeof nextBiodata.fullName === "string" && nextBiodata.fullName.trim()
      ? nextBiodata.fullName.trim()
      : user.name || null;

  const normalizedBiodata = normalizeBiodataPhones(nextBiodata, {
    phoneFieldKeySet: getPhoneFieldKeySet(FIELD_MAP),
    includePhoneLikeKeys: true,
  });

  if (execute) {
    await prisma.participantProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName,
        biodata: normalizedBiodata,
      },
      create: {
        userId: user.id,
        displayName,
        biodata: normalizedBiodata,
      },
    });
  }

  return {
    status: "migrated",
    index,
    email,
    userId: user.id,
    createdUser,
    whitelistedEmailEnsured,
    profileAction: existingProfile ? "updated" : "created",
    fileUploads,
    uploadErrors,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log("=== CSV -> Kru Profile Migration ===");
  console.log(`CSV: ${args.csvPath}`);
  console.log(`Mode: ${args.execute ? "EXECUTE" : "DRY RUN"}`);
  console.log(`Upload files: ${args.uploadFiles ? "yes" : "no"}`);
  console.log(
    `Create missing users: ${args.createMissingUsers ? "yes" : "no"}`,
  );
  if (args.uploadFiles && !R2_READY) {
    console.log("R2 not fully configured. File upload will be skipped.");
  }
  console.log("");

  if (!(await fs.stat(args.csvPath).catch(() => null))) {
    throw new Error(`CSV file not found: ${args.csvPath}`);
  }

  const rows = loadRowsFromCsv(args.csvPath);
  const limitedRows = args.limit ? rows.slice(0, args.limit) : rows;
  console.log(`Rows loaded: ${rows.length}`);
  console.log(`Rows processed: ${limitedRows.length}`);
  console.log(
    `Google Drive auth: ${
      GOOGLE_DRIVE_ACCESS_TOKEN ||
      (GOOGLE_OAUTH_CLIENT_ID &&
        GOOGLE_OAUTH_CLIENT_SECRET &&
        GOOGLE_OAUTH_REFRESH_TOKEN)
        ? "configured"
        : "not configured"
    }`,
  );

  const headerKeys = Object.keys(limitedRows[0] || {});
  const missingHeaders = FIELD_MAP.map((field) => field.header).filter(
    (header) => !headerKeys.includes(header),
  );
  if (missingHeaders.length > 0) {
    throw new Error(`CSV missing required headers: ${missingHeaders.join(", ")}`);
  }

  let catalogSync = { created: 0, updated: 0, deactivated: 0 };
  if (args.execute) {
    catalogSync = await ensureCatalogMatchesCsv();
  }
  console.log(
    `Catalog sync: created=${catalogSync.created} updated=${catalogSync.updated} deactivated=${catalogSync.deactivated}`,
  );
  console.log("");

  const summary = {
    totalRows: limitedRows.length,
    migrated: 0,
    createdProfiles: 0,
    updatedProfiles: 0,
    createdUsers: 0,
    whitelistedEmailsEnsured: 0,
    skippedMissingEmail: 0,
    skippedInvalidEmail: 0,
    skippedEmailNotFound: 0,
    uploadedFiles: 0,
    uploadErrors: 0,
  };

  const details = [];

  for (let i = 0; i < limitedRows.length; i += 1) {
    const row = limitedRows[i];
    const result = await migrateRow({
      row,
      execute: args.execute,
      uploadFiles: args.uploadFiles && R2_READY,
      createMissingUsers: args.createMissingUsers,
      index: i,
    });
    details.push(result);

    if (result.status === "migrated") {
      summary.migrated += 1;
      if (result.profileAction === "created") summary.createdProfiles += 1;
      if (result.profileAction === "updated") summary.updatedProfiles += 1;
      if (result.createdUser) summary.createdUsers += 1;
      if (result.whitelistedEmailEnsured) summary.whitelistedEmailsEnsured += 1;
      summary.uploadedFiles += result.fileUploads.filter(
        (item) => item.mode === "uploaded",
      ).length;
      summary.uploadErrors += result.uploadErrors.length;
    } else if (result.status === "skipped_missing_email") {
      summary.skippedMissingEmail += 1;
    } else if (result.status === "skipped_invalid_email") {
      summary.skippedInvalidEmail += 1;
    } else if (result.status === "skipped_email_not_found") {
      summary.skippedEmailNotFound += 1;
    }

    const emailText = result.email || "(no-email)";
    const prefix = `[${i + 1}/${limitedRows.length}] ${emailText}`;
    if (result.status === "migrated") {
      const uploaded = result.fileUploads.filter(
        (item) => item.mode === "uploaded",
      ).length;
      const createdUserText = result.createdUser ? ", created_user=1" : "";
      const whitelistedText = result.whitelistedEmailEnsured
        ? ", whitelisted=1"
        : "";
      console.log(
        `${prefix} -> ${result.profileAction} profile${createdUserText}${whitelistedText}, uploaded_files=${uploaded}, upload_errors=${result.uploadErrors.length}`,
      );
    } else {
      console.log(`${prefix} -> ${result.status}`);
    }
  }

  console.log("");
  console.log("=== Summary ===");
  console.log(`migrated: ${summary.migrated}`);
  console.log(`createdProfiles: ${summary.createdProfiles}`);
  console.log(`updatedProfiles: ${summary.updatedProfiles}`);
  console.log(`createdUsers: ${summary.createdUsers}`);
  console.log(`whitelistedEmailsEnsured: ${summary.whitelistedEmailsEnsured}`);
  console.log(`skippedMissingEmail: ${summary.skippedMissingEmail}`);
  console.log(`skippedInvalidEmail: ${summary.skippedInvalidEmail}`);
  console.log(`skippedEmailNotFound: ${summary.skippedEmailNotFound}`);
  console.log(`uploadedFiles: ${summary.uploadedFiles}`);
  console.log(`uploadErrors: ${summary.uploadErrors}`);

  const reportDir = path.join(ROOT, "scripts", "out");
  await fs.mkdir(reportDir, { recursive: true });
  const reportPath = path.join(
    reportDir,
    `migrate-kru-profiles-${Date.now()}.json`,
  );
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        args,
        summary,
        details,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`report: ${reportPath}`);
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
