'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/forms/FormField';
import { CLAIM_REFERENCE_LENGTH, cleanClaimReferenceInput } from '@/lib/claimReference';

/**
 * @param {{ value: string, onChange: (text: string) => void, error?: string|null, disabled?: boolean }} props
 */
export default function ClaimReferenceInput({ value, onChange, error = null, disabled = false }) {
  const t = useTranslations('invoices.claimReference');
  return (
    <Input
      label={t('label')}
      hint={t('hint')}
      dir="ltr"
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
