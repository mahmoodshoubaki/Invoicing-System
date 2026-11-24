'use client';

import { memo } from 'react';
import { Building2, Calendar, DollarSign, FileText, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import InfoItem from './InfoItem';
import ClaimHistory from '@/components/invoices/claims/ClaimHistory';
import ManualClaimCard from '@/components/invoices/claims/ManualClaimCard';
import { useInvoiceFinancialClaim } from './useInvoiceFinancialClaim';
import { formatCurrencyAs } from '@/utils/formatters';

function ClaimDetails({ reference, claim }) {
  const t = useTranslations('claims.card');
  const format = useLocaleFormat();
  if (!claim) {
    return (
      <div className="flex flex-col gap-3">
        <InfoItem icon={FileText} label={t('reference')} value={reference} valueClass="font-mono" />
        <p className="text-sm text-gray-400">{t('notInEtimad')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <InfoItem icon={FileText} label={t('reference')} value={claim.referenceNumber} valueClass="font-mono font-semibold" />
      <InfoItem icon={DollarSign} label={t('amount')} value={formatCurrencyAs(claim.amountInRiyal, 'SAR')} valueClass="font-semibold text-primary" />
      <InfoItem icon={Calendar} label={t('date')} value={format.date(claim.dateView)} />
      <InfoItem icon={Building2} label={t('agency')} value={claim.agencyName} />
      <InfoItem icon={FileText} label={t('contract')} value={claim.contractName} />
      <InfoItem icon={FileText} label={t('contractNumber')} value={claim.contractReferenceNumber} valueClass="font-mono" />
    </div>
  );
}

/**
 * @param {{ invoiceId: string }} props
 */
function FinancialClaimCard({ invoiceId }) {
  const t = useTranslations('claims.card');
  const { data, loading, error, reload } = useInvoiceFinancialClaim(invoiceId);

  let body;
  if (error) {
    body = (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5">
        <p className="text-sm text-red-700">{error.message || t('loadFailed')}</p>
        <Button variant="ghost" size="xs" icon={RotateCw} loading={loading} onClick={reload}>{t('tryAgain')}</Button>
      </div>
    );
  } else if (!data) {
    return null;
  } else if (!data.isEtimadContract) {
    return <ManualClaimCard invoiceId={invoiceId} />;
  } else if (data.financialClaimReference == null) {
    body = <p className="text-sm text-gray-400 text-center py-6">{t('none')}</p>;
  } else {
    body = (
      <div className="flex flex-col gap-5">
        <ClaimDetails reference={data.financialClaimReference} claim={data.claim} />
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('etimadHistory')}</h4>
          <ClaimHistory reference={data.financialClaimReference} />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">{t('title')}</h3>
        {data?.claim?.status && <StatusBadge status={data.claim.status} />}
      </div>
      {body}
    </Card>
  );
}

export default memo(FinancialClaimCard);
