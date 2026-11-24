import { getTranslations } from 'next-intl/server';

import NotFoundView from '@/components/common/NotFoundView';

export async function generateMetadata() {
  const t = await getTranslations('notFound');
  return { title: t('title') };
}

export default function NotFound() {
  return <NotFoundView fullPage />;
}
