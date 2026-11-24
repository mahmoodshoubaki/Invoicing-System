'use client';

import { useTranslations } from 'next-intl';

import { STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

export default function LateBadge({ days }) {
  const t = useTranslations('dashboard.lists');
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
      style={{ color: STATUS.critical, backgroundColor: withAlpha(STATUS.critical, 0.1) }}
    >
      {days > 0 ? t('daysLate', { count: days }) : t('dueToday')}
    </span>
  );
}
