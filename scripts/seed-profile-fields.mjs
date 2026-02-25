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
    label: "Nama Lengkap",
    description: "Nama lengkap kru.",
    fieldType: "text",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: null,
  },
  {
    key: "birthDate",
    label: "Tanggal Lahir",
    description: "Tanggal lahir kru.",
    fieldType: "date",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "facultyMajor",
    label: "Fakultas-Jurusan",
    description: "Contoh: FTI-Teknik Industri.",
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
    label: "No. Telepon Aktif",
    description: "Nomor telepon aktif kru.",
    fieldType: "phone",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "emergencyPhone",
    label: "No. Telepon Darurat",
    description: "Nomor telepon darurat.",
    fieldType: "phone",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "emergencyContactRelation",
    label: "Hubungan dengan Pemilik No. Darurat",
    description: "Hubungan pemilik no. darurat dengan kru.",
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
    label: "Alamat Tempat Tinggal Asal",
    description: "Alamat asal tempat tinggal kru.",
    fieldType: "textarea",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "itbAddress",
    label: "Alamat Selama di ITB",
    description: "Alamat kru selama di ITB.",
    fieldType: "textarea",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "bestPhotoFile",
    label: "Upload Foto Tercakep",
    description: "Foto utama kru.",
    fieldType: "file",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "email",
    label: "Email",
    description: "Email utama kru.",
    fieldType: "email",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "ktmFile",
    label: "Foto KTM",
    description: "Dokumen foto KTM.",
    fieldType: "file",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "signatureFile",
    label: "Foto TTD",
    description: "Dokumen foto tanda tangan.",
    fieldType: "file",
    isRequired: true,
    isActive: true,
    isSensitive: true,
    options: null,
  },
  {
    key: "cohortBatch",
    label: "Kru Angkatan",
    description: "Angkatan kru aktif.",
    fieldType: "number",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: null,
  },
  {
    key: "division",
    label: "Divisi",
    description: "Divisi utama kru.",
    fieldType: "select",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: ["DEVELOPER", "TECHNIC", "REPORTER", "KRU", "MUSIC"],
  },
  {
    key: "activeDivisions",
    label: "Divisi Aktif Semester Ini",
    description: "Daftar divisi yang diikuti pada semester berjalan.",
    fieldType: "checkbox",
    isRequired: false,
    isActive: true,
    isSensitive: false,
    options: ["Producer", "Announcer", "Reporter", "Marketing", "Music", "Technic"],
  },
  {
    key: "isActiveThisSemester",
    label: "Status Kru Aktif Semester Ini",
    description: "Apakah bersedia jadi kru aktif semester ini.",
    fieldType: "select",
    isRequired: true,
    isActive: true,
    isSensitive: false,
    options: ["Jelas iya dongg!!", "Nggak dulu dehh"],
  },
  {
    key: "birthdayGreetingPreference",
    label: "Preferensi Ucapan Ulang Tahun",
    description: "Preferensi kanal ucapan ulang tahun.",
    fieldType: "select",
    isRequired: false,
    isActive: true,
    isSensitive: false,
    options: [
      "Mau dong di bukomline :D",
      "Mau dong di Kehidupankru ^^",
      "Mau di dua-duanya!!",
      "Ga dulu deh T____T",
    ],
  },
  {
    key: "instagramUsername",
    label: "Username Instagram",
    description: "Username IG untuk mention ucapan (boleh '-')",
    fieldType: "text",
    isRequired: false,
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
