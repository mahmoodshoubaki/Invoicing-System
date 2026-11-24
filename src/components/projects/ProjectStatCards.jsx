'use client';

import { memo } from 'react';
import { Activity, Banknote, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import KpiTile from '@/components/dashboard/KpiTile';
import Reveal from '@/components/motion/Reveal';
import { SERIES_ROLE, STATUS } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';

const ltr = (chunks) => <span dir="ltr">{chunks}</span>;

function ProjectStatCards({ totals, currency }) {
  const t = useTranslations('projects.stats');
  const money = (v) => formatCurrency(v, currency);
  const collectionRate = totals.totalInvoicesValue > 0
    ? Math.round((totals.collectedValue / totals.totalInvoicesValue) * 100)
    : 0;

  const tiles = [
    {
      id: 'projectValue',
      label: t('projectValue'),
      value: totals.projectValue,
      format: money,
      icon: Banknote,
      accent: SERIES_ROLE.revenue,
      footnote: t('projectValueNote'),
    },
    {
      id: 'totalRevenue',
      label: t('totalRevenue'),
      value: totals.totalRevenue,
      format: money,
      icon: Activity,
      accent: SERIES_ROLE.invoiced,
      delta: t.rich('wipDelta', { value: money(totals.wip), amount: ltr }),
      deltaType: totals.wip <= 0 ? 'positive' : 'negative',
      footnote: t('totalRevenueNote'),
    },
    {
      id: 'totalInvoices',
      label: t('totalInvoices'),
      value: totals.totalInvoicesValue,
      format: money,
      icon: FileText,
      accent: SERIES_ROLE.wip,
      footnote: t('totalInvoicesNote'),
    },
    {
      id: 'collected',
      label: t('collected'),
      value: totals.collectedValue,
      format: money,
      icon: CheckCircle2,
      accent: SERIES_ROLE.collected,
      delta: t('collectedDelta', { rate: collectionRate }),
      deltaType: collectionRate >= 50 ? 'positive' : 'neutral',
      footnote: t('collectedNote'),
    },
    {
      id: 'nonCollected',
      label: t('nonCollected'),
      value: totals.nonCollectedValue,
      format: money,
      icon: Clock,
      accent: STATUS.warning,
      footnote: t('nonCollectedNote'),
    },
  ];

  return (
    <Reveal className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {tiles.map(({ id, ...tile }) => (
        <KpiTile key={id} {...tile} />
      ))}
    </Reveal>
  );
}

export default memo(ProjectStatCards);
