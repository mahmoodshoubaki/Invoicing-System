export function mapRole(raw) {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    permissionCodes: raw.permissionCodes ?? [],
  };
}

export function createRolePayload(data) {
  return {
    name: data.name,
    description: data.description,
    permissionCodes: data.permissionCodes,
  };
}

export function updateRolePayload(data) {
  return {
    name: data.name,
    description: data.description,
    permissionCodes: data.permissionCodes,
  };
}
