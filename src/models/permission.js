export function createPermission(raw) {
  return {
    name: raw.name,
    code: raw.code,
    description: raw.description,
    module: raw.module,
  };
}
