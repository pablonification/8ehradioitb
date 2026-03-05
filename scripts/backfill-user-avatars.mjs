// One-off backfill: populate User.image from Google for all users whose image
// is null. Uses the stored access_token in their Account row to call Google's
// userinfo endpoint. Skips users with no linked Google Account (script-seeded
// users who haven't logged in yet — their image will be set on first login).
//
// Usage:
//   node scripts/backfill-user-avatars.mjs [--dry-run]

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");

function loadEnvFile(filePath) {
  try {
    const raw = readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
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
    // no-op
  }
}

loadEnvFile(ENV_PATH);

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function fetchGoogleImage(accessToken) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.picture ?? null;
}

async function main() {
  console.log(`Mode: ${dryRun ? "DRY RUN" : "EXECUTE"}\n`);

  // Find all users missing an image who have a linked Google Account with a token.
  const users = await prisma.user.findMany({
    where: { image: null },
    select: {
      id: true,
      email: true,
      name: true,
      accounts: {
        where: { provider: "google" },
        select: { access_token: true },
        take: 1,
      },
    },
  });

  console.log(`Users with null image: ${users.length}`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    const account = user.accounts[0];
    if (!account?.access_token) {
      console.log(
        `  SKIP  ${user.email} — no linked Google Account (will sync on next login)`,
      );
      skipped++;
      continue;
    }

    const picture = await fetchGoogleImage(account.access_token);
    if (!picture) {
      console.log(
        `  FAIL  ${user.email} — Google API returned no picture (token may be expired)`,
      );
      failed++;
      continue;
    }

    if (dryRun) {
      console.log(`  DRY   ${user.email} — would set image: ${picture}`);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { image: picture },
      });
      console.log(`  OK    ${user.email} — image updated`);
    }
    updated++;
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped} failed=${failed}`);
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
