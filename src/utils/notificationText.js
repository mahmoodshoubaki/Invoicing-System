/**
 * What one bell notification says, in the reader's language.
 *
 * The English UI shows `englishSubject` / `englishBody`, the Arabic UI the
 * Arabic pair — falling back to the other language when one is empty, so a
 * template written in one language still says something. (`subject` / `body`
 * are the combined text the template's language setting builds; the bell does
 * not use them.)
 *
 * @param {Object} n a mapped inbox notification
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

/**
 * HTML reduced to its words. The bell never renders a notification's HTML —
 * plain text cannot run anything, so nothing has to be sanitised.
 *
 * DOMParser builds an inert document (no scripts run, no images load), which
 * makes it safe to read text out of.
 */
export function htmlToText(html) {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
