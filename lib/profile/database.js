function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeBiodata(value) {
  return isObject(value) ? value : {};
}

export function hasProfileValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (isObject(value)) return Object.keys(value).length > 0;
  return false;
}

export function stringifyProfileValue(value) {
  if (!hasProfileValue(value)) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => stringifyProfileValue(item)).filter(Boolean).join(", ");
  }
  if (isObject(value)) {
    if (typeof value.name === "string" && value.name.trim()) return value.name.trim();
    if (typeof value.url === "string" && value.url.trim()) return value.url.trim();
    if (typeof value.key === "string" && value.key.trim()) return value.key.trim();
    return JSON.stringify(value);
  }
  return String(value);
}

export function extractFileKeysFromValue(value) {
  if (!value) return [];

  if (typeof value === "string") {
    const key = value.trim();
    return key ? [key] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractFileKeysFromValue(item)).filter(Boolean);
  }

  if (isObject(value)) {
    const key =
      typeof value.key === "string"
        ? value.key.trim()
        : typeof value.url === "string"
          ? value.url.trim()
          : "";
    return key ? [key] : [];
  }

  return [];
}

export function splitRoles(roleString) {
  if (!roleString || typeof roleString !== "string") return [];
  return roleString
    .split("-")
    .map((role) => role.trim())
    .filter(Boolean);
}

function flattenSearchText(source, collector) {
  if (!hasProfileValue(source)) return;

  if (typeof source === "string" || typeof source === "number" || typeof source === "boolean") {
    collector.push(String(source).toLowerCase());
    return;
  }

  if (Array.isArray(source)) {
    for (const item of source) {
      flattenSearchText(item, collector);
    }
    return;
  }

  if (isObject(source)) {
    for (const value of Object.values(source)) {
      flattenSearchText(value, collector);
    }
  }
}

export function buildProfileFieldDefinitions({
  catalogFields,
  profiles,
  includeUnknownProfileKeys = false,
}) {
  const known = new Map();
  for (const field of catalogFields) {
    known.set(field.key, {
      key: field.key,
      label: field.label,
      fieldType: field.fieldType,
      isRequired: Boolean(field.isRequired),
      isActive: Boolean(field.isActive),
      source: "catalog",
    });
  }

  if (includeUnknownProfileKeys) {
    const unknownKeys = new Set();
    for (const profile of profiles) {
      const biodata = normalizeBiodata(profile.biodata);
      for (const key of Object.keys(biodata)) {
        if (!known.has(key)) unknownKeys.add(key);
      }
    }

    for (const key of Array.from(unknownKeys).sort((a, b) => a.localeCompare(b))) {
      known.set(key, {
        key,
        label: key,
        fieldType: "text",
        isRequired: false,
        isActive: false,
        source: "biodata",
      });
    }
  }

  return Array.from(known.values());
}

export function getMissingRequiredProfileKeys({
  biodata,
  requiredFieldKeys = [],
}) {
  const normalized = normalizeBiodata(biodata);
  return requiredFieldKeys.filter((key) => !hasProfileValue(normalized[key]));
}

export function applyProfileFilters({
  profiles,
  q = "",
  role = "",
  completeness = "all",
  fieldKey = "",
  fieldValue = "",
  requiredKeys = [],
}) {
  const query = q.trim().toLowerCase();
  const roleFilter = role.trim().toUpperCase();
  const selectedFieldKey = fieldKey.trim();
  const selectedFieldValue = fieldValue.trim().toLowerCase();

  return profiles.filter((profile) => {
    const biodata = normalizeBiodata(profile.biodata);
    const roleTokens = splitRoles(profile.user?.role);

    if (roleFilter && !roleTokens.includes(roleFilter)) {
      return false;
    }

    if (completeness === "complete" || completeness === "incomplete") {
      const hasMissingRequired = requiredKeys.some((key) => !hasProfileValue(biodata[key]));
      if (completeness === "complete" && hasMissingRequired) return false;
      if (completeness === "incomplete" && !hasMissingRequired) return false;
    }

    if (selectedFieldKey) {
      const current = biodata[selectedFieldKey];
      if (!hasProfileValue(current)) return false;
      if (selectedFieldValue) {
        const text = stringifyProfileValue(current).toLowerCase();
        if (!text.includes(selectedFieldValue)) return false;
      }
    }

    if (!query) return true;

    const searchValues = [
      profile.displayName || "",
      profile.user?.name || "",
      profile.user?.email || "",
      profile.user?.role || "",
      biodata.fullName || "",
      biodata.nim || "",
    ].map((value) => String(value).toLowerCase());

    flattenSearchText(biodata, searchValues);
    return searchValues.some((value) => value.includes(query));
  });
}

export function buildKruDatabaseRows({ profiles, fieldDefinitions }) {
  return profiles.map((profile, index) => {
    const biodata = normalizeBiodata(profile.biodata);
    const row = {
      No: index + 1,
      "User ID": profile.user?.id || "",
      "Nama Akun": profile.user?.name || "",
      "Email Akun": profile.user?.email || "",
      "Role Akun": profile.user?.role || "",
      "Display Name": profile.displayName || "",
      "Profile Created At": profile.createdAt
        ? new Date(profile.createdAt).toISOString()
        : "",
      "Profile Updated At": profile.updatedAt
        ? new Date(profile.updatedAt).toISOString()
        : "",
    };

    for (const field of fieldDefinitions) {
      row[`[${field.key}] ${field.label}`] = stringifyProfileValue(biodata[field.key]);
    }

    return row;
  });
}

export async function buildKruDatabaseRowsForExport({
  profiles,
  fieldDefinitions,
  resolveFileUrl,
}) {
  const rows = [];

  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index];
    const biodata = normalizeBiodata(profile.biodata);
    const row = {
      No: index + 1,
      "User ID": profile.user?.id || "",
      "Nama Akun": profile.user?.name || "",
      "Email Akun": profile.user?.email || "",
      "Role Akun": profile.user?.role || "",
      "Display Name": profile.displayName || "",
      "Profile Created At": profile.createdAt
        ? new Date(profile.createdAt).toISOString()
        : "",
      "Profile Updated At": profile.updatedAt
        ? new Date(profile.updatedAt).toISOString()
        : "",
    };

    for (const field of fieldDefinitions) {
      const value = biodata[field.key];
      if (field.fieldType === "file" && typeof resolveFileUrl === "function") {
        const keys = Array.from(new Set(extractFileKeysFromValue(value)));
        if (keys.length === 0) {
          row[`[${field.key}] ${field.label}`] = "";
          continue;
        }

        const links = [];
        for (const key of keys) {
          // eslint-disable-next-line no-await-in-loop
          const url = await resolveFileUrl(key);
          if (url) links.push(url);
        }
        row[`[${field.key}] ${field.label}`] = links.join(" | ");
      } else {
        row[`[${field.key}] ${field.label}`] = stringifyProfileValue(value);
      }
    }

    rows.push(row);
  }

  return rows;
}
