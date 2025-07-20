export function splitRoles(roleString) {
  if (!roleString || typeof roleString !== "string") return [];
  return roleString.split("-").filter(Boolean);
}

export function hasRole(roleString, role) {
  return splitRoles(roleString).includes(role);
}

export function hasAnyRole(roleString, allowedRoles = []) {
  const userRoles = splitRoles(roleString);
  return allowedRoles.some(r => userRoles.includes(r));
} 