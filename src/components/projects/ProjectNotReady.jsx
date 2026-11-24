'use client';

import { AlertTriangle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { listOf } from '@/lib/projectReadiness';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * @param {{ missing: string[], failed?: boolean }} props keys of `projects.readiness.fields`
 */
export default function ProjectNotReady({ missing, failed = false }) {
  const t = useTranslations('projects.readiness');
  const locale = useLocale();
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3"
      style={{ borderColor: withAlpha(STATUS.critical, 0.25), backgroundColor: withAlpha(STATUS.critical, 0.05) }}
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: STATUS.critical }} aria-hidden="true" />
      <div className="text-sm" style={{ color: CHROME.textPrimary }}>
        <p className="font-semibold">{t('title')}</p>
        {failed ? (
          <p className="mt-0.5 text-xs" style={{ color: CHROME.textSecondary }}>{t('failed')}</p>
        ) : missing.length > 0 && (
          <p className="mt-0.5 text-xs" style={{ color: CHROME.textSecondary }}>
            {t('missing', { fields: listOf(missing.map((key) => t(`fields.${key}`)), locale) })}
          </p>
        )}
      </div>
    </div>
  );
}
