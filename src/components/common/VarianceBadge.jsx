'use client';

import { memo } from 'react';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

function VarianceBadge({ days, size = 'md' }) {
  const t = useTranslations('tracker');
  const SIZES = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-xs' };
  const sizeClass = SIZES[size] ?? SIZES.md;

  if (days == null) {
    return <span className="text-xs text-gray-300">—</span>;
  }

  if (days === 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-green-50 text-green-700 ${sizeClass}`}>
        <CheckCircle2 size={12} /> {t('onTime')}
      </span>
    );
  }

  if (days > 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-red-50 text-red-600 ${sizeClass}`}>
        <TrendingUp size={12} className="rtl:-scale-x-100" /> {t('daysLate', { count: days })}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-blue-50 text-blue-700 ${sizeClass}`}>
      <TrendingDown size={12} className="rtl:-scale-x-100" /> {t('daysEarly', { count: Math.abs(days) })}
    </span>
  );
}

export default memo(VarianceBadge);
