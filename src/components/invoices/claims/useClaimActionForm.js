'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import { claimActionErrors, claimActionFormValues, claimActionProblems } from '@/lib/claimActionForm';

/**
 * @param {string} invoiceId
 * @param {object|null} entry
 * @param {(result: { gone?: boolean, message?: string }) => void} onSaved
 * @param {() => void} onConflict
 */
export function useClaimActionForm(invoiceId, entry, onSaved, onConflict) {
  const [values, setValues] = useState(() => claimActionFormValues(entry));
  const t = useTranslations('claims.errors');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const change = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] || prev.general ? { ...prev, [name]: undefined, general: undefined } : prev));
  };

  const save = async () => {
    const problems = claimActionProblems(values, t);
    setErrors(problems);
    if (Object.keys(problems).length) return;
    setSaving(true);
    try {
      if (entry) await invoiceRepository.editNonEtimadClaimAction(entry.id, values);
      else await invoiceRepository.addNonEtimadClaimAction(invoiceId, values);
      onSaved({});
    } catch (err) {
      const found = claimActionErrors(err, t);
      if (found.gone) {
        onSaved({ gone: true, message: found.general });
        return;
      }
      if (found.conflict) onConflict();
      setErrors(found);
    } finally {
      setSaving(false);
    }
  };

  return { values, change, errors, saving, save };
}
