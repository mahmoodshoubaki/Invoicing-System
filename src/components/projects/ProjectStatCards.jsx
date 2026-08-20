'use client';

import { memo } from 'react';
import { Banknote, TrendingUp, FileText, Clock } from 'lucide-react';
import { StatCard } from '@/components/common/Card';
import { formatCurrency } from '@/utils/formatters';

/**
 * The aggregated stat row at the top of the project detail page — pulled
 * out so it doesn't re-render on every tab switch or modal open/close, only
 * when `totals`/`currency` actually change.
 */
function ProjectStatCards({ totals, currency }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <StatCard
        title="Project Value"
        value={formatCurrency(totals.projectValue, currency)}
        icon={Banknote}
        color="primary"
      />
      <StatCard
        title="Total Revenue"
        value={formatCurrency(totals.totalRevenue, currency)}
        icon={TrendingUp}
        color="success"
        subtitle="WIP"
        changeType="negative"
        change={formatCurrency(totals.wip, currency)}
      />
      <StatCard
        title="Total Invoicing"
        value={formatCurrency(totals.totalInvoicesValue, currency)}
        icon={FileText}
        color="info"
      />
      <StatCard
        title="Collected Value"
        value={formatCurrency(totals.collectedValue, currency)}
        icon={FileText}
        color="info"
      />
      <StatCard
        title="Non-Collected Value"
        value={formatCurrency(totals.nonCollectedValue, currency)}
        icon={Clock}
        color="warning"
      />
    </div>
  );
}

export default memo(ProjectStatCards);
