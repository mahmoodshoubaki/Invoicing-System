/**
 * @param {Object} n
 * @param {'en'|'ar'} language
 * @returns {{ subject: string, body: string, dir: 'ltr'|'rtl' }}
 */
export function notificationText(n, language) {
  const arabic = language === 'ar';
  const first = arabic ? [n.arabicSubject, n.arabicBody] : [n.englishSubject, n.englishBody];
  const second = arabic ? [n.englishSubject, n.englishBody] : [n.arabicSubject, n.arabicBody];

  const useFirst = Boolean(first[0] || first[1]);
  const [subject, rawBody] = useFirst ? first : second;
  // The direction follows the language actually shown, not the UI's.
  const shownArabic = useFirst ? arabic : !arabic;

  return {
    subject: subject || n.subject || '',
    body: n.isHtml ? htmlToText(rawBody || n.body) : (rawBody || n.body || ''),
    dir: shownArabic ? 'rtl' : 'ltr',
  };
}

export function htmlToText(html) {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
