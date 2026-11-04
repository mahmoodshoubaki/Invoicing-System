export const BUILT_IN_PLACEHOLDERS = ['RecipientName', 'ActionUrl'];

const KEYWORDS = new Set([
  'end', 'else', 'if', 'elseif', 'for', 'in', 'while', 'case', 'when', 'break', 'continue',
  'func', 'ret', 'with', 'capture', 'readonly', 'import', 'include', 'tablerow', 'true', 'false', 'null',
]);

/**
 * @param {string[]} texts
 * @returns {string[]}
 */
export function findPlaceholders(texts) {
  const found = [];
  const loopVars = new Set();
  const add = (name) => {
    if (!name || KEYWORDS.has(name) || BUILT_IN_PLACEHOLDERS.includes(name) || loopVars.has(name)) return;
    if (!found.includes(name)) found.push(name);
  };

  for (const text of texts) {
    const source = String(text ?? '');
    for (const m of source.matchAll(/\{\{-?\s*for\s+([A-Za-z_]\w*)\s+in\s+([A-Za-z_]\w*)/g)) {
      loopVars.add(m[1]);
    }
    for (const m of source.matchAll(/\{\{-?\s*for\s+[A-Za-z_]\w*\s+in\s+([A-Za-z_]\w*)/g)) add(m[1]);
    // Every other expression: its leading name, before any `.`, `|` or space.
    for (const m of source.matchAll(/\{\{-?\s*([A-Za-z_]\w*)/g)) add(m[1]);
  }
  return found;
}
