'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';

export default function ProjectCell({ code, name }) {
  const t = useTranslations('dashboard.lists');
  if (!code) return <span className="text-xs" style={{ color: CHROME.textMuted }}>{t('noProject')}</span>;
  return (
    <div className="min-w-0">
      <Link
        href={ROUTES.PROJECT_DETAIL(encodeURIComponent(code))}
        onClick={(e) => e.stopPropagation()}
        dir="ltr"
        className="font-mono text-xs underline-offset-2 hover:underline"
      >
        {code}
      </Link>
      {name && <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>{name}</p>}
    </div>
  );
}
