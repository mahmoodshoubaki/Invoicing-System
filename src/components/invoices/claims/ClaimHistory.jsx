'use client';

import { memo } from 'react';
import { RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ClaimHistoryTable from './ClaimHistoryTable';
import { useFinancialClaimHistory } from './useFinancialClaimHistory';

/**
 * @param {{ reference: number }} props
 */
function ClaimHistory({ reference }) {
  const t = useTranslations('claims.history');
  const { history, loading, error, reload } = useFinancialClaimHistory(reference);

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5">
        <p className="text-sm text-red-700">{error.message || t('loadFailed')}</p>
        <Button variant="ghost" size="xs" icon={RotateCw} onClick={reload}>{t('tryAgain')}</Button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>;
  }

  return <ClaimHistoryTable history={history} />;
}

export default memo(ClaimHistory);
