'use client';

import Link from 'next/link';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Button from '@/components/common/Button';
import { STATUS } from '@/theme/vizPalette';

/**
 * @param {{ form: Object, cancelHref: string, submitLabel: string }} props
 */
export default function ChangeRequestActions({ form, cancelHref, submitLabel }) {
  const t = useTranslations('changeRequests.form');
  const count = form.shownCount;

  return (
    <div className="sticky bottom-0 z-10 mt-5 rounded-2xl border border-[#e9e7e5] bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgb(60_60_58/0.18)]">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {count > 0 && (
          <span className="me-auto text-xs" style={{ color: STATUS.critical }}>
            {t('toFixShown', { count })}
          </span>
        )}
        <Link href={cancelHref}>
          <Button variant="ghost" disabled={form.submitting}>{t('cancel')}</Button>
        </Link>
        <Button icon={Send} onClick={form.submit} loading={form.submitting}>{submitLabel}</Button>
      </div>
    </div>
  );
}
