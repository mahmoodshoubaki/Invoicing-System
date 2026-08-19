/** Role entity — one item from GetAllRoles. Not named createRole: that name is
 *  reserved for the actual CreateRole operation, not this GET mapping. */
export function mapRole(raw) {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    permissionCodes: raw.permissionCodes ?? [],
  };
}

/** Request body for CreateRole. */
export function createRolePayload(data) {
  return {
    name: data.name,
    description: data.description,
    permissionCodes: data.permissionCodes,
  };
}

/** Request body for UpdateRole. */
export function updateRolePayload(data) {
  return {
    name: data.name,
    description: data.description,
    permissionCodes: data.permissionCodes,
  };
}
