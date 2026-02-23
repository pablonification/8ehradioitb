import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EDITABILITY = {
  key: false,
  fieldType: false,
  label: true,
  description: true,
  isRequired: true,
  isActive: true,
  options: true,
  isSensitive: true,
};

export const BASELINE_PROFILE_FIELDS = [
  {
    key: "fullName",
    label: "Full Name",
    description: "Participant full legal name.",
    fieldType: "text",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: null,
  },
  {
    key: "birthDate",
    label: "Birth Date",
    description: "Participant date of birth.",
    fieldType: "date",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "facultyMajor",
    label: "Faculty and Major",
    description: "Faculty and major currently enrolled at ITB.",
    fieldType: "text",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: null,
  },
  {
    key: "nim",
    label: "NIM",
    description: "Student identification number.",
    fieldType: "text",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "activePhone",
    label: "Active Phone Number",
    description: "Primary active phone number for participant.",
    fieldType: "phone",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "emergencyPhone",
    label: "Emergency Phone Number",
    description: "Emergency contact phone number.",
    fieldType: "phone",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "emergencyContactRelation",
    label: "Emergency Contact Relation",
    description: "Relation of emergency contact to participant.",
    fieldType: "text",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: null,
  },
  {
    key: "lineId",
    label: "LINE ID",
    description: "Participant LINE account identifier.",
    fieldType: "text",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: null,
  },
  {
    key: "originAddress",
    label: "Origin Address",
    description: "Permanent or origin address.",
    fieldType: "textarea",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "itbAddress",
    label: "ITB Address",
    description: "Current address while studying at ITB.",
    fieldType: "textarea",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "photoUrl",
    label: "Photo URL",
    description: "Link to participant photo.",
    fieldType: "url",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "cohortBatch",
    label: "Cohort Batch",
    description: "Student cohort or batch year.",
    fieldType: "number",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: null,
  },
  {
    key: "division",
    label: "Division",
    description: "Division within event or organization.",
    fieldType: "select",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: ["DEVELOPER", "TECHNIC", "REPORTER", "KRU", "MUSIC"],
  },
  {
    key: "socialMedia",
    label: "Social Media",
    description: "Main social media handle or URL.",
    fieldType: "text",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: null,
  },
];

function toCatalogData(field) {
  return {
    key: field.key,
    label: field.label,
    description: field.description,
    fieldType: field.fieldType,
    isRequired: field.isRequired,
    isActive: field.isActive,
    options: field.options,
    metadata: {
      isSensitive: field.isSensitive,
      adminEditability: DEFAULT_ADMIN_EDITABILITY,
      isSystemDefault: true,
    },
  };
}

export async function seedProfileFields() {
  for (const field of BASELINE_PROFILE_FIELDS) {
    const data = toCatalogData(field);
    await prisma.profileFieldCatalog.upsert({
      where: { key: field.key },
      update: data,
      create: data,
    });
  }
}

async function main() {
  await seedProfileFields();
  console.log("PROFILE_FIELDS_SEEDED");
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error("PROFILE_FIELDS_SEED_FAILED", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
