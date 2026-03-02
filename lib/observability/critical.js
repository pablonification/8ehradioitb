const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || "";

function serializeError(error) {
  if (!error) return null;
  return {
    name: error?.name || "Error",
    message: error?.message || String(error),
    stack: typeof error?.stack === "string" ? error.stack.slice(0, 4000) : "",
  };
}

function sanitizeContext(context) {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return {};
  }

  const safe = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === null || value === undefined) {
      safe[key] = value;
      continue;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      safe[key] = value;
      continue;
    }
    safe[key] = JSON.stringify(value).slice(0, 1000);
  }
  return safe;
}

export async function reportCriticalError({
  source,
  message,
  error,
  context = {},
}) {
  const payload = {
    source: source || "unknown",
    message: message || "critical_error",
    context: sanitizeContext(context),
    error: serializeError(error),
    at: new Date().toISOString(),
  };

  console.error("[critical]", payload);

  if (!ALERT_WEBHOOK_URL) return;

  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (webhookError) {
    console.error("[critical:webhook_failed]", {
      source: payload.source,
      error: serializeError(webhookError),
    });
  }
}
