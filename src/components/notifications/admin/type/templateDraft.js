import { CHANNEL, TEMPLATE_LANGUAGE } from '@/constants/notifications';
import { findPlaceholders } from '@/lib/templatePlaceholders';

/**
 * A channel's words as the editor holds them, and the checks a save must pass.
 * Plain functions, no React — the editor's hook and its tabs read them, and
 * they can be tested on their own.
 */

/** Subjects are capped by the server; bodies have no limit. */
export const SUBJECT_MAX = 200;

/** The documented keys, for when the lookup cannot be read. */
export const FALLBACK_LANGUAGES = [
  { key: TEMPLATE_LANGUAGE.ENGLISH, value: 'English' },
  { key: TEMPLATE_LANGUAGE.ARABIC, value: 'Arabic' },
  { key: TEMPLATE_LANGUAGE.ENGLISH_THEN_ARABIC, value: 'English then Arabic' },
  { key: TEMPLATE_LANGUAGE.ARABIC_THEN_ENGLISH, value: 'Arabic then English' },
];

/** A fresh draft for a channel that has no words yet: email in HTML, in-app in plain text. */
export function blankDraft(channelKey) {
  return {
    languageKey: TEMPLATE_LANGUAGE.ENGLISH_THEN_ARABIC,
    priorityKey: null,
    isHtml: channelKey === CHANNEL.EMAIL,
    englishSubject: '',
    englishBody: '',
    arabicSubject: '',
    arabicBody: '',
    placeholders: [],
  };
}

/** A draft started from a saved version. */
export function draftFrom(version) {
  return {
    languageKey: version.languageKey ?? TEMPLATE_LANGUAGE.ENGLISH_THEN_ARABIC,
    priorityKey: version.priorityKey ?? null,
    isHtml: version.isHtml,
    englishSubject: version.englishSubject,
    englishBody: version.englishBody,
    arabicSubject: version.arabicSubject,
    arabicBody: version.arabicBody,
    placeholders: version.placeholders.map((p) => ({ ...p })),
  };
}

export const sameDraft = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** What a save, or a preview of the editor's text, sends. */
export function draftRequest(draft, typeId, channelKey) {
  return {
    notificationTypeId: typeId,
    channelKey,
    priorityKey: draft.priorityKey,
    languageKey: draft.languageKey,
    englishSubject: draft.englishSubject,
    arabicSubject: draft.arabicSubject,
    englishBody: draft.englishBody,
    arabicBody: draft.arabicBody,
    isHtml: draft.isHtml,
    placeholders: draft.placeholders.filter((p) => p.key.trim()).map((p) => ({ key: p.key.trim(), value: p.value })),
  };
}

/**
 * Everything that would stop a save, worked out once: the bar shows `saveHint`,
 * the tab bar marks the tab each problem is on, and each tab shows its own.
 *
 * @returns {{
 *   listed: string[],    value names the list has
 *   unlisted: string[],  values the text uses that the list does not name (the server refuses those)
 *   missing: string[],   texts still empty, in words
 *   tooLong: boolean,    a subject over SUBJECT_MAX
 *   emptyKey: boolean,   a listed value without a name
 *   saveHint: string|null,
 * }}
 */
export function checkDraft(draft) {
  const used = findPlaceholders([draft.englishSubject, draft.englishBody, draft.arabicSubject, draft.arabicBody]);
  const listed = draft.placeholders.map((p) => p.key.trim()).filter(Boolean);
  const unlisted = used.filter((name) => !listed.includes(name));
  const missing = [
    !draft.englishSubject.trim() && 'an English subject',
    !draft.englishBody.trim() && 'an English body',
    !draft.arabicSubject.trim() && 'an Arabic subject',
    !draft.arabicBody.trim() && 'an Arabic body',
  ].filter(Boolean);
  const tooLong = [draft.englishSubject, draft.arabicSubject].some((t) => t.length > SUBJECT_MAX);
  const emptyKey = draft.placeholders.some((p) => !p.key.trim());

  const saveHint = missing.length > 0
    ? `Still needed on Body: ${missing.join(', ')}.`
    : tooLong ? `A subject is at most ${SUBJECT_MAX} characters (Body).`
      : emptyKey ? 'A value under Placeholders has no name.'
        : unlisted.length > 0 ? `The text uses ${unlisted.join(', ')}, which Placeholders does not list.`
          : null;

  return { listed, unlisted, missing, tooLong, emptyKey, saveHint };
}

/** The preview box's starting values: each listed value's default, or its name in brackets. */
export function samplesFromDefaults(draft) {
  const values = Object.fromEntries(
    draft.placeholders.filter((p) => p.key.trim()).map((p) => [p.key.trim(), p.value || `[${p.key.trim()}]`])
  );
  return JSON.stringify(values, null, 2);
}

/**
 * The sample values as typed. A preview takes any JSON; a test email needs an
 * object of values (`asObject`), which the server reads as name → value.
 *
 * @returns {{ values: any } | { error: string }}
 */
export function parseSamples(text, { asObject = false } = {}) {
  let values;
  try {
    values = text.trim() ? JSON.parse(text) : {};
  } catch {
    return { error: 'The sample values are not valid JSON.' };
  }
  if (asObject && (values === null || typeof values !== 'object' || Array.isArray(values))) {
    return { error: 'The sample values must be an object, like { "InvoiceNumber": "INV-0042" }.' };
  }
  return { values };
}
