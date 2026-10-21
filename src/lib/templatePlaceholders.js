/**
 * Which values a template's text uses — so the placeholder list (which the
 * server requires to name every one, NTF-008) can be filled from the text
 * rather than typed twice.
 *
 * The text is Scriban: `{{ InvoiceNumber }}`, `{{ for invoice in Invoices }}…
 * {{ invoice.Number }}…{{ end }}`. What counts as a value the SENDER supplies:
 *   - a bare name at the top level            → `InvoiceNumber`
 *   - the list a `for` walks                  → `Invoices`
 * and what does not:
 *   - the loop's own item and its fields      → `invoice`, `invoice.Number`
 *   - the built-ins                           → RecipientName, ActionUrl
 *   - Scriban's own words                     → end, else, if…
 */

/**
 * The values the module fills in itself — the server's BuiltInPlaceholders.All.
 * Anything else must be listed on the version, or the save is refused.
 * (`Name` used to be one; the server no longer treats it as special.)
 */
export const BUILT_IN_PLACEHOLDERS = ['RecipientName', 'ActionUrl'];

const KEYWORDS = new Set([
  'end', 'else', 'if', 'elseif', 'for', 'in', 'while', 'case', 'when', 'break', 'continue',
  'func', 'ret', 'with', 'capture', 'readonly', 'import', 'include', 'tablerow', 'true', 'false', 'null',
]);

/**
 * @param {string[]} texts every subject and body
 * @returns {string[]} the names, in the order first used
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
    // Loop variables first, so `invoice` inside its own loop is not taken for a value.
    for (const m of source.matchAll(/\{\{-?\s*for\s+([A-Za-z_]\w*)\s+in\s+([A-Za-z_]\w*)/g)) {
      loopVars.add(m[1]);
    }
    for (const m of source.matchAll(/\{\{-?\s*for\s+[A-Za-z_]\w*\s+in\s+([A-Za-z_]\w*)/g)) add(m[1]);
    // Every other expression: its leading name, before any `.`, `|` or space.
    for (const m of source.matchAll(/\{\{-?\s*([A-Za-z_]\w*)/g)) add(m[1]);
  }
  return found;
}
