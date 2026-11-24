import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/constants/routes';

/**
 * @param {{ fullPage?: boolean }} props
 */
export default async function NotFoundView({ fullPage = false }) {
  const t = await getTranslations('notFound');

  return (
    <div className={`flex items-center justify-center p-4 ${fullPage ? 'min-h-screen bg-app' : 'min-h-[60vh]'}`}>
      <div className="max-w-md text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
          <SearchX size={40} className="text-primary" aria-hidden="true" />
        </div>
        <p className="mb-1 text-sm font-semibold text-primary" dir="ltr">404</p>
        <h1 className="mb-2 text-3xl font-bold text-gray-800">{t('title')}</h1>
        <p className="mb-6 text-gray-500">{t('body')}</p>
        <Link
          href={ROUTES.DASHBOARD}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:opacity-90"
        >
          <ArrowLeft size={16} className="rtl:-scale-x-100" aria-hidden="true" />
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
