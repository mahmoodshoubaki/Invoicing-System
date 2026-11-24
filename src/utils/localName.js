/**
 * @param {string|null} en
 * @param {string|null} ar
 * @param {string} language
 * @returns {string}
 */
export function localName(en, ar, language) {
  return (language === 'ar' ? (ar || en) : (en || ar)) || '—';
}
