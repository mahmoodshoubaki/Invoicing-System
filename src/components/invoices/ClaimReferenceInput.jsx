'use client';

import { Input } from '@/components/forms/FormField';
import { CLAIM_REFERENCE_LENGTH, cleanClaimReferenceInput } from '@/lib/claimReference';

/**
 * The Financial Claim Reference Number box (2026-10-13): digits only, at most
 * twelve, optional. Shared by creating and editing an invoice.
 *
 * @param {{ value: string, onChange: (text: string) => void, error?: string|null, disabled?: boolean }} props
 */
export default function ClaimReferenceInput({ value, onChange, error = null, disabled = false }) {
  return (
    <Input
      label="Financial Claim Reference Number"
      hint="Optional — exactly 12 digits, not starting with 0"
      inputMode="numeric"
      autoComplete="off"
      maxLength={CLAIM_REFERENCE_LENGTH}
      placeholder="202610120001"
      value={value}
      onChange={(e) => onChange(cleanClaimReferenceInput(e.target.value))}
      error={error}
      disabled={disabled}
      className="font-mono"
    />
  );
}
