'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';

import { isRtlLocale } from '@/i18n/config';
import { formatDate, formatDateTime } from '@/utils/formatters';

/**
 * @returns {{ locale: string, rtl: boolean, date: (value) => string, dateTime: (value) => string }}
 */
export function useLocaleFormat() {
  const locale = useLocale();
  return useMemo(() => ({
    locale,
    rtl: isRtlLocale(locale),
    date: (value) => formatDate(value, locale),
    dateTime: (value) => formatDateTime(value, locale),
  }), [locale]);
}
