import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma.js";
import {
  getPhoneFieldKeySet,
  normalizeBiodataPhones,
} from "../lib/profile/phone.js";

const execute = process.argv.includes("--execute");

function toObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function stableStringify(value) {
  return JSON.stringify(value);
}

function collectChangedKeys(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed = [];
  for (const key of keys) {
    if (stableStringify(before[key]) !== stableStringify(after[key])) {
      changed.push(key);
    }
  }
  return changed.sort();
}

async function main() {
  console.log("=== Normalize Profile Phones ===");
  console.log(`Mode: ${execute ? "EXECUTE" : "DRY RUN"}`);

  const [catalogFields, profiles] = await Promise.all([
    prisma.profileFieldCatalog.findMany({
      select: {
        key: true,
        fieldType: true,
      },
    }),
    prisma.participantProfile.findMany({
      select: {
        id: true,
        userId: true,
        biodata: true,
      },
    }),
  ]);

  const phoneFieldKeySet = getPhoneFieldKeySet(catalogFields);
  const report = {
    generatedAt: new Date().toISOString(),
    execute,
    totalProfiles: profiles.length,
    changedProfiles: 0,
    updatedProfiles: 0,
    phoneFieldKeys: Array.from(phoneFieldKeySet).sort(),
    details: [],
  };

  for (const profile of profiles) {
    const current = toObject(profile.biodata);
    const normalized = normalizeBiodataPhones(current, {
      phoneFieldKeySet,
      includePhoneLikeKeys: true,
    });

    const changedKeys = collectChangedKeys(current, normalized);
    if (changedKeys.length === 0) continue;

    report.changedProfiles += 1;
    report.details.push({
      profileId: profile.id,
      userId: profile.userId,
      changedKeys,
    });

    if (execute) {
      await prisma.participantProfile.update({
        where: { id: profile.id },
        data: {
          biodata: normalized,
        },
      });
      report.updatedProfiles += 1;
    }
  }

  const outputDir = path.resolve("scripts/out");
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(
    outputDir,
    `normalize-profile-phones-${Date.now()}.json`,
  );
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`Profiles total: ${report.totalProfiles}`);
  console.log(`Changed: ${report.changedProfiles}`);
  console.log(`Updated: ${report.updatedProfiles}`);
  console.log(`Report: ${outputPath}`);
}

main()
  .catch((error) => {
    console.error("Normalize profile phones failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
