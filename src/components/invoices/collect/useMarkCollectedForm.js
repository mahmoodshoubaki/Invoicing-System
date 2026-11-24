'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import {
  localDay, markCollectedDefaults, markCollectedLimits, markCollectedProblems,
} from '@/lib/markCollectedForm';

/**
 * @param {object|null} invoice
 * @param {() => void} onCollected
 */
export function useMarkCollectedForm(invoice, onCollected) {
  const [today] = useState(() => localDay());
  const t = useTranslations('invoices.collect');
  const format = useLocaleFormat();
  const [edits, setEdits] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const limits = useMemo(() => markCollectedLimits(invoice, today), [invoice, today]);
  const values = { ...markCollectedDefaults(invoice, today), ...edits };

  const change = (name, value) => {
    setEdits((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] || prev.general ? { ...prev, [name]: undefined, general: undefined } : prev));
  };

  const save = async () => {
    if (!invoice || saving) return;
    const problems = markCollectedProblems(values, limits, t, format.date);
    setErrors(problems);
    if (Object.keys(problems).length) return;
    setSaving(true);
    try {
      await invoiceRepository.markCollected(invoice.id, values);
      onCollected();
    } catch (err) {
      setErrors({ general: err?.message || t('failed') });
    } finally {
      setSaving(false);
    }
  };

  return { values, limits, errors, saving, change, save };
}
