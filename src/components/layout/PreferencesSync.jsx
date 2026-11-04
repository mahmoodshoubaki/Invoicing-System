'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setLanguage, setCurrency, setCurrencySymbol } from '@/store/slices/uiSlice';
import { getCookie } from '@/utils/cookies';
import { Currencies } from '@/constants/currencies';
import { DEFAULT_CURRENCY, DEFAULT_LANGUAGE } from '@/constants/appConfig';

export default function PreferencesSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    const lang = getCookie('language', DEFAULT_LANGUAGE);
    const curr = getCookie('currency', DEFAULT_CURRENCY);
    const symbol = Currencies.find(c => c.Key === curr)?.symbol ?? '';

    dispatch(setLanguage(lang));
    dispatch(setCurrency(curr));
    dispatch(setCurrencySymbol(symbol));

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [dispatch]);

  return null;
}
