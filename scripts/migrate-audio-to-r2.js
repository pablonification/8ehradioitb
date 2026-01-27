const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const process = require("process");

// Configuration
const REQUIRED_ENV_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

/**
 * Validates environment variables
 */
function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `Error: Missing required environment variables: ${missing.join(", ")}`,
    );
    console.error("Please set them in your .env file or environment.");
    process.exit(1);
  }
}

/**
 * Recursively scan directory for files
 * @param {string} dir
 * @returns {string[]} Array of absolute file paths
 */
function scanDirectory(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDirectory(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

/**
 * Filters files for audio extensions
 * @param {string[]} files
 * @returns {string[]} Audio files only
 */
function filterAudioFiles(files) {
  return files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return AUDIO_EXTENSIONS.has(ext);
  });
}

/**
 * Format bytes to human readable string
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Determine content type based on file extension
 * @param {string} filePath
 * @returns {string}
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".m4a":
      return "audio/mp4";
    case ".aac":
      return "audio/aac";
    case ".ogg":
      return "audio/ogg";
    default:
      return "application/octet-stream";
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isExecute = args.includes("--execute");
  const showHelp = args.includes("--help") || args.includes("-h");

  if (showHelp || (!isDryRun && !isExecute)) {
    console.log(`
=== R2 Audio Migration Script ===

Usage:
  node scripts/migrate-audio-to-r2.js [options]

Options:
  --dry-run   Scan files and show what would be uploaded (no changes)
  --execute   Perform the actual upload to Cloudflare R2
  --help      Show this help message

Environment Variables Required:
  R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET_NAME
    `);
    return;
  }

  // Check env vars logic
  if (isExecute) {
    validateEnv();
  } else if (isDryRun) {
    // Warn if missing but allow scanning
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.warn(
        `[WARNING] Missing env vars for actual upload: ${missing.join(", ")}`,
      );
      console.warn(`[WARNING] Proceeding with scanning only...`);
    }
  }

  console.log(`=== R2 Audio Migration Script ===`);
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "EXECUTE"}`);
  console.log(`Scanning: ${PUBLIC_DIR}\n`);

  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error(`Error: Directory not found: ${PUBLIC_DIR}`);
    process.exit(1);
  }

  const allFiles = scanDirectory(PUBLIC_DIR);
  const audioFiles = filterAudioFiles(allFiles);

  if (audioFiles.length === 0) {
    console.log("No audio files found.");
    return;
  }

  // Calculate stats
  let totalSize = 0;
  audioFiles.forEach((file) => {
    totalSize += fs.statSync(file).size;
  });

  console.log("Found audio files:");
  audioFiles.forEach((file, index) => {
    const relPath = path.relative(PUBLIC_DIR, file);
    const size = formatBytes(fs.statSync(file).size);
    console.log(`  ${index + 1}. public/${relPath} (${size})`);
  });

  console.log(
    `\nTotal: ${audioFiles.length} files, ${formatBytes(totalSize)}\n`,
  );

  // Initialize S3 Client if we have creds
  let s3Client;
  if (
    (isExecute || isDryRun) &&
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID
  ) {
    try {
      s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });
    } catch (e) {
      if (isExecute) {
        console.error("Failed to initialize S3 Client:", e);
        process.exit(1);
      }
    }
  }

  let uploadCount = 0;
  let errorCount = 0;

  for (const file of audioFiles) {
    const relPath = path.relative(PUBLIC_DIR, file); // e.g. "voice-ann/file.mp3"
    // R2 Key should match relative path
    const r2Key = relPath.split(path.sep).join("/"); // Ensure forward slashes

    if (isDryRun) {
      console.log(`[DRY RUN] Would upload: public/${relPath} -> ${r2Key}`);
      uploadCount++;
    } else if (isExecute) {
      try {
        const fileContent = fs.readFileSync(file);
        const contentType = getContentType(file);

        const command = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: r2Key,
          Body: fileContent,
          ContentType: contentType,
        });

        await s3Client.send(command);
        const publicUrl = process.env.R2_PUBLIC_URL
          ? `${process.env.R2_PUBLIC_URL}/${r2Key}`
          : `https://${process.env.R2_BUCKET_NAME}.r2.dev/${r2Key}`;

        console.log(`[UPLOADED] public/${relPath} -> ${publicUrl}`);
        uploadCount++;
      } catch (err) {
        console.error(
          `[ERROR] Failed to upload public/${relPath}:`,
          err.message,
        );
        errorCount++;
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Files found: ${audioFiles.length}`);
  console.log(`Total size: ${formatBytes(totalSize)}`);
  if (isExecute) {
    console.log(`Successfully uploaded: ${uploadCount}`);
    console.log(`Errors: ${errorCount}`);
  } else {
    console.log(`Would upload: ${uploadCount} files`);
    console.log(`Run with --execute to perform actual upload.`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
