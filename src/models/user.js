/**
 * Current-user profile — from Identity/me. Roles here are names (e.g.
 * "Administrator"), not the role ids GetAuthorizedUsers/roleIds use — this
 * is for display, not for cross-referencing GetAllRoles.
 */
export function mapMe(raw) {
  return {
    username: raw.username,
    displayName: raw.displayName,
    email: raw.email || null,
    roles: raw.roles ?? [],
  };
}

/** User entity — one item from GetAuthorizedUsers. */
export function mapUser(raw) {
  return {
    username: raw.username,
    email: raw.email,
    displayName: raw.displayName,
    isActive: raw.isActive,
    roleIds: raw.roleIds ?? [],
  };
}

/**
 * Request body for UpdateUser — just the short login handle (our
 * displayName, per the same field swap as CreateUser), roles, and active
 * status. No longer takes email or full name.
 */
export function updateUserPayload(data) {
  return {
    username: data.displayName,
    RoleIds: data.roleIds,
    IsActive: data.isActive,
  };
}

/** Request body for CreateUser — just the short login handle (our displayName) and roles. */
export function createUserPayload(data) {
  return {
    username: data.displayName,
    RoleIds: data.roleIds,
  };
}

/**
 * AD candidate — one item from GetUnregisteredADUsers. Unlike
 * GetAuthorizedUsers, this is raw AD data, so field names carry their
 * conventional AD meaning: username is the short login handle (sAMAccountName),
 * displayName is the full name — matching CreateUser/UpdateUser's own body
 * convention directly, with no swap needed.
 */
export function mapUnregisteredADUser(raw) {
  return {
    username: raw.username,
    displayName: raw.displayName,
    email: raw.email,
  };
}
