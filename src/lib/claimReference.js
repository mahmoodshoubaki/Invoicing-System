const TWELVE_DIGITS = /^[1-9]\d{11}$/;

export const CLAIM_REFERENCE_LENGTH = 12;

/** Keeps digits only, at most 12, while typing. */
export function cleanClaimReferenceInput(text) {
  return String(text ?? '').replace(/\D/g, '').slice(0, CLAIM_REFERENCE_LENGTH);
}

/** The validation message for a typed reference, or null when it can be saved. Empty is allowed. */
export function claimReferenceProblem(text, t) {
  const value = String(text ?? '').trim();
  if (!value || TWELVE_DIGITS.test(value)) return null;
  return value.startsWith('0')
    ? t('errors.claimZero')
    : t('errors.claimLength');
}

/** The value the API expects: a number, or null for none. */
export function toClaimReference(text) {
  const value = String(text ?? '').trim();
  return value ? Number(value) : null;
}

/** A saved reference as input text. */
export function claimReferenceText(value) {
  return value == null ? '' : String(value);
}
