'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setLanguage, setCurrency, setCurrencySymbol } from '@/store/slices/uiSlice';
import { getCookie } from '@/utils/cookies';
import { Currencies } from '@/constants/currencies';

export default function PreferencesSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    const lang = getCookie('language', 'en');
    const curr = getCookie('currency', 'SAR');
    const symbol = Currencies.find(c => c.Key === curr)?.symbol ?? '';

    dispatch(setLanguage(lang));
    dispatch(setCurrency(curr));
    dispatch(setCurrencySymbol(symbol));

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [dispatch]);

  return null;
}
