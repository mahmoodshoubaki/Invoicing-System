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
    // The user's GUID. Added to GetAuthorizedUsers so a workflow's humanTask can
    // put real ids into `assignToUserIds` — before it existed, the only
    // identifier the API returned was `username`, and assigning a task to a
    // named person could not be built at all.
    id: raw.id ?? null,
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
    username: data.username,
    RoleIds: data.roleIds,
    IsActive: data.isActive,
    // Whether the person hears about this change (2026-10-07). Turned off: an
    // email only. Back on, or roles changed: email + bell. The backend never
    // notifies an admin about an edit to their own account.
    notifyUser: data.notifyUser ?? true,
  };
}

/** Request body for CreateUser — just the short login handle (our displayName) and roles. */
export function createUserPayload(data) {
  return {
    username: data.username,
    RoleIds: data.roleIds,
    // A welcome with their roles, by email and in the bell. Ticked by default.
    notifyUser: data.notifyUser ?? true,
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
