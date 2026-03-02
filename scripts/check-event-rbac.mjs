import { PrismaClient } from "@prisma/client";
import { canPerformEventAction, EVENT_ACTIONS } from "../lib/events/auth.js";

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const eventId = "507f1f77bcf86cd799439011";

  const submitAuthenticated = await canPerformEventAction(
    "507f191e810c19729de860ea",
    eventId,
    EVENT_ACTIONS.REGISTRATION_SUBMIT,
  );
  assert(
    submitAuthenticated.allowed === true,
    "Expected REGISTRATION_SUBMIT to be allowed for authenticated user",
  );

  const submitAnonymous = await canPerformEventAction(
    null,
    eventId,
    EVENT_ACTIONS.REGISTRATION_SUBMIT,
  );
  assert(
    submitAnonymous.allowed === false,
    "Expected REGISTRATION_SUBMIT to be denied for anonymous user",
  );

  const unknownUserResult = await canPerformEventAction(
    "000000000000000000000000",
    eventId,
    EVENT_ACTIONS.FORM_EDIT,
  );

  if (unknownUserResult.reason === "db_unavailable") {
    console.warn(
      "EVENT_RBAC_WARN DB unavailable, skipped organizer membership check",
    );
  } else {
    assert(
      unknownUserResult.allowed === false,
      "Expected FORM_EDIT to be denied for non-organizer non-admin user",
    );
  }

  console.log("EVENT_RBAC_OK");
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("EVENT_RBAC_CHECK_FAILED", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
