function toRawString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

export function normalizePhoneTo62(value) {
  const raw = toRawString(value);
  if (!raw) return raw;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  // Convert international dialing prefix 00xx.. -> xx..
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("62")) {
    // Already in country code format.
  } else if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith("8")) {
    digits = `62${digits}`;
  } else {
    return digits;
  }

  // Common typo: 6208... -> should be 628...
  if (digits.startsWith("620")) {
    digits = `62${digits.slice(3)}`;
  }

  return digits;
}

export function normalizePhoneLikeValue(value) {
  if (value === null || value === undefined) return value;

  if (typeof value === "string" || typeof value === "number") {
    return normalizePhoneTo62(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizePhoneLikeValue(item));
  }

  if (typeof value === "object") {
    const next = {};
    for (const [key, current] of Object.entries(value)) {
      next[key] = normalizePhoneLikeValue(current);
    }
    return next;
  }

  return value;
}

function isPhoneLikeKey(key) {
  if (typeof key !== "string") return false;
  const normalized = key.toLowerCase();
  return (
    normalized.includes("phone") ||
    normalized.includes("telepon") ||
    normalized.includes("telp") ||
    normalized.endsWith("hp") ||
    normalized.includes("nomorhp")
  );
}

export function getPhoneFieldKeySet(catalogFields = []) {
  const set = new Set();
  for (const field of catalogFields) {
    if (!field || typeof field !== "object") continue;
    if (field.fieldType === "phone" && typeof field.key === "string") {
      set.add(field.key);
    }
  }
  return set;
}

export function normalizeBiodataPhones(
  biodata,
  { phoneFieldKeySet = new Set(), includePhoneLikeKeys = true } = {},
) {
  if (!biodata || typeof biodata !== "object" || Array.isArray(biodata)) {
    return {};
  }

  const next = { ...biodata };
  for (const [key, value] of Object.entries(next)) {
    const shouldNormalize =
      phoneFieldKeySet.has(key) || (includePhoneLikeKeys && isPhoneLikeKey(key));
    if (!shouldNormalize) continue;
    next[key] = normalizePhoneLikeValue(value);
  }

  return next;
}
