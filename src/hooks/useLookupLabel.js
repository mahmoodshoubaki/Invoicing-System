'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';

const lookupKey = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

/**
 * @param {string} namespace messages namespace keyed by the slug of the English value
 * @returns {(value: string) => string} the translated value, or the value itself when unknown
 */
export function useLookupLabel(namespace) {
  const t = useTranslations(namespace);
  return useCallback((value) => {
    const key = lookupKey(value);
    return key && t.has(key) ? t(key) : value;
  }, [t]);
}
