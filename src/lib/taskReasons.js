export const OTHER_REASON_KEY = 'other';
export const REASON_TEXT_MAX = 500;
export const REASON_KEY_MAX = 100;

const blank = (value) => String(value ?? '').trim() === '';

/**
 * @param {Object} button
 * @param {{ reasonKey?: string, otherReason?: string }} [picked]
 * @param {(key: string, values?: Object) => string} t the `tasks.errors` translator
 */
export function reasonProblem(button, { reasonKey = '', otherReason = '' } = {}, t) {
  const reasons = button?.reasons;
  if (!reasons) return null;
  if (!reasonKey) return reasons.required ? t('needsReason', { label: button.label }) : null;
  if (reasonKey === OTHER_REASON_KEY) {
    const text = otherReason.trim();
    if (!text) return t('typeReason');
    return text.length > REASON_TEXT_MAX ? t('reasonTooLong', { max: REASON_TEXT_MAX }) : null;
  }
  return reasons.options.some((o) => o.key === reasonKey) ? null : t('pickReason');
}

export function reasonToSend(button, { reasonKey = '', otherReason = '' } = {}) {
  if (!button?.reasons || !reasonKey) return {};
  return reasonKey === OTHER_REASON_KEY ? { reasonKey, otherReason: otherReason.trim() } : { reasonKey };
}

/**
 * @param {{ required: boolean, options: Array<{ key: string, label: string }> }} reasons
 * @returns {string[]}
 */
export function reasonsListProblems(reasons) {
  const options = reasons?.options ?? [];
  const problems = [];
  if (options.length === 0) problems.push('asks for a reason but lists none, so "Other" would be the only choice');
  if (options.some((o) => blank(o.key) || blank(o.label))) problems.push('has a reason with no name');
  if (options.some((o) => (o.key ?? '').length > REASON_KEY_MAX || (o.label ?? '').length > REASON_TEXT_MAX)) {
    problems.push(`has a reason longer than ${REASON_TEXT_MAX} characters`);
  }
  const keys = options.map((o) => o.key).filter((k) => !blank(k));
  if (new Set(keys).size !== keys.length) problems.push('has two reasons with the same key');
  if (options.some((o) => (o.key ?? '').toLowerCase() === OTHER_REASON_KEY || (o.label ?? '').trim().toLowerCase() === 'other')) {
    problems.push('lists "Other" as a reason, which is always added on its own');
  }
  return problems;
}
