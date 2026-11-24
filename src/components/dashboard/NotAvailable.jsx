'use client';

import { Hourglass } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CHROME } from '@/theme/vizPalette';

export default function NotAvailable({ text }) {
  const t = useTranslations('dashboard');
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#e1e0d9] px-5 py-10 text-center">
      <Hourglass size={20} style={{ color: CHROME.textMuted }} aria-hidden="true" />
      <p className="text-xs" style={{ color: CHROME.textMuted }}>{text ?? t('notAvailable')}</p>
    </div>
  );
}
