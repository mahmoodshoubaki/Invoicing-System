'use client';

import { MotionConfig } from 'motion/react';
import { useSelector } from 'react-redux';

import ErrorNote from '@/components/ui/ErrorNote';
import DashboardHero from '@/components/dashboard/DashboardHero';
import SummaryCards from '@/components/dashboard/SummaryCards';
import MonthlyFigures from '@/components/dashboard/MonthlyFigures';
import InvoicePipelineCard from '@/components/dashboard/InvoicePipelineCard';
import PendingApprovalsCard from '@/components/dashboard/PendingApprovalsCard';
import DelayedCyclesCard from '@/components/dashboard/DelayedCyclesCard';
import SlaViolationsCard from '@/components/dashboard/SlaViolationsCard';
import { withProjectStatus } from '@/components/dashboard/lists/listHref';
import { useDashboard, useDashboardFilters } from '@/components/dashboard/useDashboard';
import Reveal from '@/components/motion/Reveal';
import { ROUTES } from '@/constants/routes';
import { selectInvoiceStatuses } from '@/store/slices/lookupsSlice';
import { formatCurrency } from '@/utils';

export default function DashboardPage() {
  const currency = useSelector((state) => state.ui.currency);
  const invoiceStatuses = useSelector(selectInvoiceStatuses);
  const money = (v) => formatCurrency(v, currency);
  const filters = useDashboardFilters();
  const { financial, invoices, pending, trend, delayed, sla } = useDashboard(filters);
  const listHref = (route) => withProjectStatus(route, filters.projectStatus);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-6">
        <DashboardHero financial={financial} invoices={invoices} pending={pending} filters={filters} />

        <SummaryCards
          invoices={invoices}
          pending={pending}
          delayed={delayed}
          sla={sla}
          projectStatus={filters.projectStatus}
          money={money}
        />
        {invoices.status === 'error' && <ErrorNote error={invoices.error} onRetry={invoices.reload} />}

        <MonthlyFigures filters={filters} financial={financial} trend={trend} money={money} />

        <Reveal className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InvoicePipelineCard statuses={invoiceStatuses} invoices={invoices} money={money} />
          <PendingApprovalsCard source={pending} money={money} href={listHref(ROUTES.DASHBOARD_PENDING_APPROVALS)} />
        </Reveal>

        <Reveal className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DelayedCyclesCard source={delayed} href={listHref(ROUTES.DASHBOARD_DELAYED_CYCLES)} />
          <SlaViolationsCard source={sla} href={listHref(ROUTES.DASHBOARD_SLA_VIOLATIONS)} />
        </Reveal>
      </div>
    </MotionConfig>
  );
}
