'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setLanguage, setCurrency, setCurrencySymbol } from '@/store/slices/uiSlice';
import { getCookie } from '@/utils/cookies';
import { Currencies } from '@/constants/currencies';
import { DEFAULT_CURRENCY } from '@/constants/appConfig';
import { LANGUAGE_COOKIE, LANGUAGE_CURRENCY, resolveLanguage, textDirection } from '@/i18n/config';

export default function PreferencesSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    const lang = resolveLanguage(getCookie(LANGUAGE_COOKIE, ''));
    const curr = getCookie('currency', '') || LANGUAGE_CURRENCY[lang] || DEFAULT_CURRENCY;
    const symbol = Currencies.find(c => c.Key === curr)?.symbol ?? '';

    dispatch(setLanguage(lang));
    dispatch(setCurrency(curr));
    dispatch(setCurrencySymbol(symbol));

    document.documentElement.lang = lang;
    document.documentElement.dir = textDirection(lang);
  }, [dispatch]);

  return null;
}
