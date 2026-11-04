'use client';

import { AlertTriangle, BanknoteIcon, CalendarX, Clock } from 'lucide-react';

import Reveal from '@/components/motion/Reveal';
import { ROUTES } from '@/constants/routes';
import { INVOICE_STATUS_ID } from '@/constants/statuses';
import { SERIES_ROLE, STATUS } from '@/theme/vizPalette';
import KpiTile from './KpiTile';
import { withProjectStatus } from './lists/listHref';
import { pendingBreakdown } from './lists/pendingTypes';
import { plural, sourceNote } from './sourceNote';

const flag = (count, busyText) => (count == null
  ? {}
  : { delta: count > 0 ? busyText : 'All clear', deltaType: count > 0 ? 'negative' : 'positive' });

/**
 * @param {{ invoices: { status: string, data: Object|null }, pending: { status: string, data: Object|null }, delayed: { status: string, data: Object|null }, sla: { status: string, data: Object|null }, projectStatus: string, money: (v: number) => string, }} props
 */
export default function SummaryCards({ invoices, pending, delayed, sla, projectStatus, money }) {
  const collected = invoices.data?.byStatus.find((s) => s.statusId === INVOICE_STATUS_ID.COLLECTED) ?? null;
  const waiting = pending.data ? pending.data.byType.reduce((sum, t) => sum + t.count, 0) : null;
  const lateCycles = delayed.data?.total ?? null;
  const lateTasks = sla.data?.total ?? null;

  const tiles = [
    {
      label: 'Total Collected',
      value: invoices.data ? (collected?.amount ?? 0) : null,
      format: money,
      icon: BanknoteIcon,
      accent: SERIES_ROLE.collected,
      footnote: sourceNote(invoices, `${plural(collected?.count ?? 0, 'collected invoice')} · all time`, 'No access to invoices'),
      href: invoices.status === 'forbidden' ? null : ROUTES.INVOICES_WITH_STATUS(INVOICE_STATUS_ID.COLLECTED),
    },
    {
      label: 'Delayed BOQ cycles',
      value: lateCycles,
      icon: CalendarX,
      accent: STATUS.serious,
      ...flag(lateCycles, 'Behind plan'),
      footnote: sourceNote(delayed, `Across ${plural(delayed.data?.boqCount ?? 0, 'BOQ')}`, 'No access to BOQs'),
      href: delayed.status === 'forbidden' ? null : withProjectStatus(ROUTES.DASHBOARD_DELAYED_CYCLES, projectStatus),
    },
    {
      label: 'Pending Approvals',
      value: waiting,
      icon: Clock,
      accent: STATUS.warning,
      ...flag(waiting, 'Action required'),
      footnote: sourceNote(pending, pendingBreakdown(pending.data?.byType ?? []) || 'Nothing waiting', 'No access'),
      href: pending.status === 'forbidden' ? null : withProjectStatus(ROUTES.DASHBOARD_PENDING_APPROVALS, projectStatus),
    },
    {
      label: 'SLA Violations',
      value: lateTasks,
      icon: AlertTriangle,
      accent: STATUS.critical,
      ...flag(lateTasks, 'Past due'),
      footnote: sourceNote(sla, 'Workflow tasks past due', 'No access to workflow runs'),
      href: sla.status === 'forbidden' ? null : withProjectStatus(ROUTES.DASHBOARD_SLA_VIOLATIONS, projectStatus),
    },
  ];

  return (
    <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => <KpiTile key={tile.label} {...tile} />)}
    </Reveal>
  );
}
