import { CLAIM_NOTES_MAX } from '@/constants/financialClaims';

const ROW_NOT_FOUND = 'INV-017';
const SAVED_AT_SAME_TIME = 'INV-015';
const FIELD_KEYS = { stagekey: 'stageKey', actiondate: 'actionDate', notes: 'notes' };

const joined = (messages) => (Array.isArray(messages) ? messages : [messages]).filter(Boolean).join(' ');

/**
 * @param {object|null} entry
 * @returns {{ stageKey: string, actionDate: string, notes: string }}
 */
export function claimActionFormValues(entry) {
  return {
    stageKey: entry?.stageKey != null ? String(entry.stageKey) : '',
    actionDate: entry?.actionDate ? String(entry.actionDate).slice(0, 10) : '',
    notes: entry?.notes ?? '',
  };
}

/**
 * @returns {{ stageKey?: string, notes?: string }}
 */
export function claimActionProblems({ stageKey, notes }, t) {
  const problems = {};
  if (!stageKey) problems.stageKey = t('chooseStage');
  if (String(notes ?? '').trim().length > CLAIM_NOTES_MAX) problems.notes = t('notesTooLong', { max: CLAIM_NOTES_MAX });
  return problems;
}

/**
 * @returns {{ stageKey?: string, actionDate?: string, notes?: string, general?: string, gone?: boolean, conflict?: boolean }}
 */
export function claimActionErrors(err, t) {
  if (err?.code === ROW_NOT_FOUND) return { gone: true, general: err.message || t('gone') };
  if (err?.code === SAVED_AT_SAME_TIME) {
    return { conflict: true, general: t('savedSameTime') };
  }
  const found = {};
  const other = [];
  for (const [rawKey, messages] of Object.entries(err?.errors ?? {})) {
    const text = joined(messages);
    if (!text) continue;
    const key = FIELD_KEYS[String(rawKey).split('.').pop().toLowerCase()];
    if (key) found[key] = text;
    else other.push(text);
  }
  if (other.length) found.general = other.join(' ');
  if (!Object.keys(found).length) found.general = err?.message || t('saveFailed');
  return found;
}

/**
 * @returns {{ message: string, reload: boolean }}
 */
export function claimDeleteError(err, t) {
  if (err?.code === ROW_NOT_FOUND) return { message: err.message || t('alreadyDeleted'), reload: true };
  if (err?.code === SAVED_AT_SAME_TIME) {
    return { message: err.message || t('changedSameTime'), reload: true };
  }
  return { message: err?.message || t('deleteFailed'), reload: false };
}
