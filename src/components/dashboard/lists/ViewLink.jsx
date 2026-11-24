'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Button from '@/components/common/Button';

export default function ViewLink({ href, label }) {
  const t = useTranslations('dashboard.lists');
  return (
    <Link href={href} onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="xs" icon={Eye}>{label ?? t('view')}</Button>
    </Link>
  );
}
