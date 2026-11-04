export function mapMe(raw) {
  return {
    userId: raw.userId ?? null,
    username: raw.username,
    displayName: raw.displayName,
    email: raw.email || null,
    roles: raw.roles ?? [],
  };
}

export function mapUser(raw) {
  return {
    id: raw.id ?? null,
    username: raw.username,
    email: raw.email,
    displayName: raw.displayName,
    isActive: raw.isActive,
    roleIds: raw.roleIds ?? [],
  };
}

export function updateUserPayload(data) {
  return {
    username: data.username,
    RoleIds: data.roleIds,
    IsActive: data.isActive,
    notifyUser: data.notifyUser ?? true,
  };
}

export function createUserPayload(data) {
  return {
    username: data.username,
    RoleIds: data.roleIds,
    notifyUser: data.notifyUser ?? true,
  };
}

export function mapUnregisteredADUser(raw) {
  return {
    username: raw.username,
    displayName: raw.displayName,
    email: raw.email,
  };
}
