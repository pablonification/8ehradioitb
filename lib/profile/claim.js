function normalizeString(value) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

export function normalizeNim(value) {
  return normalizeString(value).replace(/\s+/g, "").toUpperCase();
}

export function normalizeLast4Input(value) {
  const digits = normalizeString(value).replace(/\D/g, "");
  return digits.slice(-4);
}

export function normalizePhoneDigits(value) {
  return normalizeString(value).replace(/\D/g, "");
}

function collectStringValues(source, collector) {
  if (source === null || source === undefined) return;
  if (typeof source === "string" || typeof source === "number") {
    const raw = String(source).trim();
    if (raw) collector.push(raw);
    return;
  }
  if (Array.isArray(source)) {
    for (const item of source) {
      collectStringValues(item, collector);
    }
    return;
  }
  if (typeof source === "object") {
    for (const value of Object.values(source)) {
      collectStringValues(value, collector);
    }
  }
}

export function getEmergencyPhoneCandidates(biodata) {
  if (!biodata || typeof biodata !== "object" || Array.isArray(biodata)) return [];

  const prioritizedKeys = [
    "emergencyPhone",
    "emergencyPhoneNumber",
    "noTeleponDarurat",
    "nomorTeleponDarurat",
    "emergency_contact_phone",
    "emergency_contact_number",
  ];

  const collected = [];
  for (const key of prioritizedKeys) {
    if (key in biodata) {
      collectStringValues(biodata[key], collected);
    }
  }

  if (collected.length === 0) {
    for (const [key, value] of Object.entries(biodata)) {
      const normalizedKey = key.toLowerCase();
      const emergencyLike =
        normalizedKey.includes("emergency") || normalizedKey.includes("darurat");
      const phoneLike =
        normalizedKey.includes("phone") ||
        normalizedKey.includes("telepon") ||
        normalizedKey.includes("telp") ||
        normalizedKey.includes("hp");
      if (emergencyLike && phoneLike) {
        collectStringValues(value, collected);
      }
    }
  }

  const digits = collected
    .map((item) => normalizePhoneDigits(item))
    .filter((item) => item.length >= 4);
  return Array.from(new Set(digits));
}

export function getMaskedEmergencyHintFromProfile(profile) {
  const candidates = getEmergencyPhoneCandidates(profile?.biodata);
  if (candidates.length === 0) return "";
  const selected = candidates[0];
  return `******${selected.slice(-2)}`;
}

export function buildCooldownMessage(cooldownUntil) {
  if (!cooldownUntil) return "Terlalu banyak percobaan, coba lagi nanti.";
  const now = Date.now();
  const diffMs = new Date(cooldownUntil).getTime() - now;
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return "Terlalu banyak percobaan, coba lagi nanti.";
  }
  const minutes = Math.max(1, Math.ceil(diffMs / 60000));
  return `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`;
}
