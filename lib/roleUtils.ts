export function splitRoles(roleString: string | null | undefined): string[] {
  if (!roleString || typeof roleString !== 'string') return []
  return roleString.split('-').filter(Boolean)
}

export function hasRole(roleString: string | null | undefined, role: string): boolean {
  return splitRoles(roleString).includes(role)
}

export function hasAnyRole(
  roleString: string | null | undefined,
  allowedRoles: string[] = []
): boolean {
  const userRoles = splitRoles(roleString)
  return allowedRoles.some((r) => userRoles.includes(r))
}
