'use client';

import { Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrency, setCurrencySymbol, setLanguage } from '@/store/slices/uiSlice';
import { setCookie } from '@/utils/cookies';
import { Currencies } from '@/constants/currencies';
import { LANGUAGE_COOKIE, LANGUAGE_CURRENCY, textDirection } from '@/i18n/config';

export default function LanguageToggle() {
  const dispatch = useDispatch();
  const router = useRouter();
  const language = useSelector((s) => s.ui.language);

  const toggle = () => {
    const next = language === 'en' ? 'ar' : 'en';
    const currency = LANGUAGE_CURRENCY[next];
    dispatch(setLanguage(next));
    dispatch(setCurrency(currency));
    dispatch(setCurrencySymbol(Currencies.find((c) => c.Key === currency)?.symbol ?? ''));
    setCookie(LANGUAGE_COOKIE, next);
    setCookie('currency', currency);
    document.documentElement.dir = textDirection(next);
    document.documentElement.lang = next;
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors"
    >
      <Globe size={14} />
      {language === 'en' ? 'عربي' : 'English'}
    </button>
  );
}
