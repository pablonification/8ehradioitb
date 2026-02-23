import fs from "node:fs/promises";
import path from "node:path";
import { encode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ORGANIZER_USER_ID = "507f191e810c19729de860f1";
const ORGANIZER_EMAIL = "smoke-organizer@8eh.local";
const PARTICIPANT_USER_ID = "507f191e810c19729de860f2";
const PARTICIPANT_EMAIL = "smoke-participant@8eh.local";

const ORGANIZER_COOKIE_PATH = ".tmp/organizer.cookie";
const PARTICIPANT_COOKIE_PATH = ".tmp/participant.cookie";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function ensureUser({ id, email, role, name }) {
  return prisma.user.upsert({
    where: { id },
    update: {
      email,
      role,
      name,
    },
    create: {
      id,
      email,
      role,
      name,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });
}

async function buildCookie(tokenPayload) {
  const secret = process.env.NEXTAUTH_SECRET;
  assert(Boolean(secret), "NEXTAUTH_SECRET is required");

  const token = await encode({
    token: tokenPayload,
    secret,
    maxAge: 60 * 60,
    salt: "next-auth.session-token",
  });

  const secureToken = await encode({
    token: tokenPayload,
    secret,
    maxAge: 60 * 60,
    salt: "__Secure-next-auth.session-token",
  });

  return `next-auth.session-token=${token}; __Secure-next-auth.session-token=${secureToken}`;
}

async function writeCookie(filePath, cookieValue) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${cookieValue}\n`, "utf8");
}

async function main() {
  const organizer = await ensureUser({
    id: ORGANIZER_USER_ID,
    email: ORGANIZER_EMAIL,
    role: "DEVELOPER",
    name: "Smoke Organizer",
  });

  const participant = await ensureUser({
    id: PARTICIPANT_USER_ID,
    email: PARTICIPANT_EMAIL,
    role: "KRU",
    name: "Smoke Participant",
  });

  const organizerCookie = await buildCookie({
    sub: organizer.id,
    role: organizer.role,
    email: organizer.email,
    name: "Smoke Organizer",
  });

  const participantCookie = await buildCookie({
    sub: participant.id,
    role: participant.role,
    email: participant.email,
    name: "Smoke Participant",
  });

  await writeCookie(ORGANIZER_COOKIE_PATH, organizerCookie);
  await writeCookie(PARTICIPANT_COOKIE_PATH, participantCookie);

  console.log("TEST_SESSION_SETUP_OK");
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("TEST_SESSION_SETUP_FAILED", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
