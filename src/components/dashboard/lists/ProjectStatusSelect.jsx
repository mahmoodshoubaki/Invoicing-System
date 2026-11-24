'use client';

import { Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { controlClass } from '@/components/ui/kit';
import { useProjectStatusLabel } from '@/hooks/useProjectStatusLabel';
import { CHROME } from '@/theme/vizPalette';

/**
 * @param {{ value: string, onChange: (value: string) => void, statuses: string[] }} props
 */
export default function ProjectStatusSelect({ value, onChange, statuses }) {
  const t = useTranslations('dashboard.statusFilter');
  const statusLabel = useProjectStatusLabel();
  const options = value && !statuses.includes(value) ? [value, ...statuses] : statuses;
  return (
    <span className="flex items-center gap-2">
      <Filter size={13} style={{ color: CHROME.textMuted }} aria-hidden="true" />
      <select aria-label={t('label')} value={value} onChange={(e) => onChange(e.target.value)} className={controlClass}>
        <option value="">{t('all')}</option>
        {options.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
      </select>
    </span>
  );
}
