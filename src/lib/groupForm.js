const NAME_TAKEN = 'IDT-016';
const NOT_FOUND = 'IDT-015';

const joined = (messages) => (Array.isArray(messages) ? messages : [messages]).filter(Boolean).join(' ');

/**
 * A CreateGroup / UpdateGroup refusal as form errors.
 *
 * @returns {{ name?: string, general?: string, gone?: boolean }}
 */
export function groupFormErrors(err) {
  if (err?.code === NAME_TAKEN) return { name: err.message || 'Another group already has this name.' };
  if (err?.code === NOT_FOUND) return { general: 'This group no longer exists.', gone: true };
  const errors = err?.errors ?? {};
  const nameKey = Object.keys(errors).find((k) => k.toLowerCase() === 'name');
  if (nameKey) return { name: joined(errors[nameKey]) || 'A name is required.' };
  return { general: err?.message || 'The group could not be saved.' };
}

/** What stops the form before it is sent. */
export function groupFormProblems({ name }) {
  return String(name ?? '').trim() ? {} : { name: 'A name is required.' };
}
