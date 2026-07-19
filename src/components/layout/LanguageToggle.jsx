'use client';

import { Globe } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setLanguage } from '@/store/slices/uiSlice';
import { setCookie } from '@/utils/cookies';

export default function LanguageToggle() {
  const dispatch = useDispatch();
  const language = useSelector((s) => s.ui.language);

  const toggle = () => {
    const next = language === 'en' ? 'ar' : 'en';
    dispatch(setLanguage(next));
    setCookie('language', next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
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
