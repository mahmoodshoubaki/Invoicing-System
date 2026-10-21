'use client';

import { memo } from 'react';
import { Activity, Banknote, CheckCircle2, Clock, FileText } from 'lucide-react';
import KpiTile from '@/components/dashboard/KpiTile';
import Reveal from '@/components/motion/Reveal';
import { SERIES_ROLE, STATUS } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';

/**
 * The aggregated stat row at the top of the project detail page — pulled
 * out so it doesn't re-render on every tab switch or modal open/close, only
 * when `totals`/`currency` actually change.
 */
function ProjectStatCards({ totals, currency }) {
  const money = (v) => formatCurrency(v, currency);
  const collectionRate = totals.totalInvoicesValue > 0
    ? Math.round((totals.collectedValue / totals.totalInvoicesValue) * 100)
    : 0;

  const tiles = [
    {
      label: 'Project Value',
      value: totals.projectValue,
      format: money,
      icon: Banknote,
      accent: SERIES_ROLE.revenue,
      footnote: 'Contracted total',
    },
    {
      label: 'Total Revenue',
      value: totals.totalRevenue,
      format: money,
      icon: Activity,
      accent: SERIES_ROLE.invoiced,
      delta: `${money(totals.wip)} WIP`,
      deltaType: totals.wip <= 0 ? 'positive' : 'negative',
      footnote: 'Recognised to date',
    },
    {
      label: 'Total Invoices',
      value: totals.totalInvoicesValue,
      format: money,
      icon: FileText,
      accent: SERIES_ROLE.wip,
      // Says what is left out, because a total that quietly drops rows is a
      // total nobody can reconcile against the Invoices tab.
      footnote: 'Excludes rejected and cancelled',
    },
    {
      label: 'Collected',
      value: totals.collectedValue,
      format: money,
      icon: CheckCircle2,
      accent: SERIES_ROLE.collected,
      delta: `${collectionRate}% of invoices`,
      deltaType: collectionRate >= 50 ? 'positive' : 'neutral',
      footnote: 'Cash received',
    },
    {
      label: 'Non-Collected',
      value: totals.nonCollectedValue,
      format: money,
      icon: Clock,
      accent: STATUS.warning,
      //delta: totals.nonCollectedValue > 0 ? 'Outstanding' : 'All settled',
      //deltaType: totals.nonCollectedValue > 0 ? 'negative' : 'positive',
      footnote: 'Awaiting collection',
    },
  ];

  return (
    <Reveal className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {tiles.map((tile) => (
        <KpiTile key={tile.label} {...tile} />
      ))}
    </Reveal>
  );
}

export default memo(ProjectStatCards);
