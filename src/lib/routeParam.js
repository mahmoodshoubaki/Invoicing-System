const MAX_DECODE_PASSES = 3;

/** Decodes a route segment until it stops changing, so a proxy that encoded it twice still yields the plain value. */
export function decodeRouteParam(value) {
  let decoded = String(value ?? '');
  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    let next;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      return decoded;
    }
    if (next === decoded) return decoded;
    decoded = next;
  }
  return decoded;
}
