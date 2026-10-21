/**
 * An invoice's Financial Claim Reference Number (2026-10-13).
 *
 * Optional, but when given it is exactly 12 digits and never starts with 0 —
 * 100000000000 to 999999999999 — and it travels as a NUMBER, not text. Twelve
 * digits are well inside what a JavaScript number holds exactly.
 */

const TWELVE_DIGITS = /^[1-9]\d{11}$/;

export const CLAIM_REFERENCE_LENGTH = 12;

/** What the box may hold while typing: digits only, at most 12. */
export function cleanClaimReferenceInput(text) {
  return String(text ?? '').replace(/\D/g, '').slice(0, CLAIM_REFERENCE_LENGTH);
}

/** Why a typed reference cannot be saved, or null. Empty is fine — it is optional. */
export function claimReferenceProblem(text) {
  const value = String(text ?? '').trim();
  if (!value) return null;
  if (!TWELVE_DIGITS.test(value)) {
    return value.startsWith('0')
      ? 'The financial claim reference number cannot start with 0.'
      : 'The financial claim reference number must be exactly 12 digits.';
  }
  return null;
}

/** The number to send, or null for none. Only call once claimReferenceProblem is null. */
export function toClaimReference(text) {
  const value = String(text ?? '').trim();
  return value ? Number(value) : null;
}

/** How a saved one reads in a box: its digits, or empty. */
export function claimReferenceText(value) {
  return value == null ? '' : String(value);
}
