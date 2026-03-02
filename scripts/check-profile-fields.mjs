import { PrismaClient } from "@prisma/client";
import { BASELINE_PROFILE_FIELDS } from "./seed-profile-fields.mjs";

const prisma = new PrismaClient();

function stableJson(value) {
  return JSON.stringify(value ?? null);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const records = await prisma.profileFieldCatalog.findMany({
    where: {
      key: {
        in: BASELINE_PROFILE_FIELDS.map((field) => field.key),
      },
    },
  });

  assert(
    records.length === BASELINE_PROFILE_FIELDS.length,
    `Expected ${BASELINE_PROFILE_FIELDS.length} baseline records, found ${records.length}`,
  );

  const byKey = new Map(records.map((record) => [record.key, record]));

  for (const expected of BASELINE_PROFILE_FIELDS) {
    const actual = byKey.get(expected.key);
    assert(actual, `Missing baseline field: ${expected.key}`);

    assert(
      actual.fieldType === expected.fieldType,
      `Field ${expected.key} expected fieldType=${expected.fieldType} but found ${actual.fieldType}`,
    );
    assert(
      actual.isRequired === expected.isRequired,
      `Field ${expected.key} expected isRequired=${expected.isRequired} but found ${actual.isRequired}`,
    );
    assert(
      actual.isActive === expected.isActive,
      `Field ${expected.key} expected isActive=${expected.isActive} but found ${actual.isActive}`,
    );

    assert(
      stableJson(actual.options) === stableJson(expected.options),
      `Field ${expected.key} has unexpected options`,
    );

    assert(
      Boolean(actual.metadata && typeof actual.metadata === "object"),
      `Field ${expected.key} metadata missing`,
    );
    assert(
      actual.metadata.isSensitive === expected.isSensitive,
      `Field ${expected.key} expected isSensitive=${expected.isSensitive} but found ${actual.metadata.isSensitive}`,
    );

    const adminEditability = actual.metadata.adminEditability;
    assert(
      Boolean(adminEditability && typeof adminEditability === "object"),
      `Field ${expected.key} adminEditability metadata missing`,
    );
    assert(
      adminEditability.key === false &&
        adminEditability.fieldType === false &&
        adminEditability.label === true &&
        adminEditability.description === true &&
        adminEditability.isRequired === true &&
        adminEditability.isActive === true &&
        adminEditability.options === true &&
        adminEditability.isSensitive === true,
      `Field ${expected.key} has invalid adminEditability metadata`,
    );
  }

  console.log("PROFILE_FIELDS_CHECK_OK");
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("PROFILE_FIELDS_CHECK_FAILED", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
