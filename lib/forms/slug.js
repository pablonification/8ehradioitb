import { customAlphabet } from "nanoid";

export const RESERVED_EVENT_SLUGS = new Set([
  "api",
  "dashboard",
  "login",
  "not-found",
  "password",
  "blog",
  "about-us",
  "agency",
  "media-partner",
  "podcast",
  "programs",
  "faq",
  "proxy-audio",
  "_next",
  "favicon",
  "favicon-ico",
  "contributors",
  "events",
  "forms",
  "form",
  "profile",
  "admin",
  "settings",
  "sitemap",
  "sitemap-xml",
]);

const MAX_SLUG_LENGTH = 64;
const RANDOM_EVENT_SLUG_LENGTH = 32;
const createRandomSlug = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  RANDOM_EVENT_SLUG_LENGTH,
);

function trimHyphen(value) {
  return value.replace(/^-+|-+$/g, "");
}

export function normalizeSlugSegment(input) {
  if (!input || typeof input !== "string") return "";

  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  return trimHyphen(normalized).slice(0, MAX_SLUG_LENGTH);
}

export function deriveSlugBase(title, requestedSlug = "") {
  const preferred = normalizeSlugSegment(requestedSlug) || normalizeSlugSegment(title);
  let base = preferred || "form-entry";

  if (RESERVED_EVENT_SLUGS.has(base)) {
    base = `${base}-form`;
  }

  if (RESERVED_EVENT_SLUGS.has(base)) {
    base = "form-entry";
  }

  return base.slice(0, MAX_SLUG_LENGTH);
}

function withNumericSuffix(base, index) {
  if (index <= 1) return base;

  const suffix = `-${index}`;
  const maxBaseLength = Math.max(1, MAX_SLUG_LENGTH - suffix.length);
  const trimmedBase = trimHyphen(base.slice(0, maxBaseLength)) || "form";
  return `${trimmedBase}${suffix}`;
}

export async function generateUniqueEventSlug({
  title,
  requestedSlug = "",
  isTaken,
}) {
  if (typeof isTaken !== "function") {
    throw new Error("isTaken must be a function");
  }

  const normalizedRequestedSlug = normalizeSlugSegment(requestedSlug);
  if (normalizedRequestedSlug) {
    const base = deriveSlugBase(title, normalizedRequestedSlug);

    for (let i = 1; i <= 10000; i += 1) {
      const candidate = withNumericSuffix(base, i);
      if (RESERVED_EVENT_SLUGS.has(candidate)) continue;

      // eslint-disable-next-line no-await-in-loop
      const taken = await isTaken(candidate);
      if (!taken) return candidate;
    }
  } else {
    for (let i = 1; i <= 10000; i += 1) {
      const candidate = createRandomSlug();
      if (RESERVED_EVENT_SLUGS.has(candidate)) continue;

      // eslint-disable-next-line no-await-in-loop
      const taken = await isTaken(candidate);
      if (!taken) return candidate;
    }
  }

  throw new Error("Unable to generate unique slug");
}
