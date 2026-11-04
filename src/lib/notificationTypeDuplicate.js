export const TYPE_CODE_MAX = 20;
export const TYPE_NAME_MAX = 100;
export const TYPE_CODE_PATTERN = /^[A-Z0-9_]+$/;

const CODE_SUFFIX = '_COPY';
const EN_SUFFIX = ' Copy';
const AR_SUFFIX = ' - نسخة';

const withSuffix = (text, suffix, max) => `${String(text ?? '').trim().slice(0, max - suffix.length).trimEnd()}${suffix}`;

/** "WF_TASK_ASSIGNED" → "WF_TASK_ASSIG_COPY", cut to fit 20. */
export const copyCode = (code) => withSuffix(code, CODE_SUFFIX, TYPE_CODE_MAX).replace(/^_/, '');
export const copyEnglishName = (name) => withSuffix(name, EN_SUFFIX, TYPE_NAME_MAX);
export const copyArabicName = (name) => withSuffix(name, AR_SUFFIX, TYPE_NAME_MAX);

/** The AddType rules for the three fields a copy changes. */
export function copyProblems({ code, englishName, arabicName }) {
  const name = (value) => (!value.trim() ? 'Needed.' : value.length > TYPE_NAME_MAX ? `At most ${TYPE_NAME_MAX} characters.` : null);
  return {
    code: !code.trim() ? 'Needed.'
      : code.length > TYPE_CODE_MAX ? `At most ${TYPE_CODE_MAX} characters.`
        : !TYPE_CODE_PATTERN.test(code) ? 'Capital letters, digits and _ only.' : null,
    englishName: name(englishName),
    arabicName: name(arabicName),
  };
}

/** AddType's body for a copy of `details` (GetTypeDetails') under new names. */
export function copyTypeFields(details, { code, englishName, arabicName }) {
  return {
    code: code.trim(),
    englishName: englishName.trim(),
    arabicName: arabicName.trim(),
    description: details.description?.trim() || null,
    category: details.category,
    actionUrlPattern: details.actionUrlPattern?.trim() || null,
    priorityKey: details.priorityKey,
    emailSenderId: details.emailSenderId ?? null,
  };
}

/** The version of a channel's words a copy takes: the live one, or else the newest. */
export function versionToCopy(versions) {
  const list = versions ?? [];
  return list.find((v) => v.isActive) ?? list.reduce((newest, v) => (!newest || v.version > newest.version ? v : newest), null);
}
