'use client';

import { AlertTriangle, BanknoteIcon, CalendarX, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Reveal from '@/components/motion/Reveal';
import { ROUTES } from '@/constants/routes';
import { INVOICE_STATUS_ID } from '@/constants/statuses';
import { SERIES_ROLE, STATUS } from '@/theme/vizPalette';
import KpiTile from './KpiTile';
import { withProjectStatus } from './lists/listHref';
import { pendingBreakdown } from './lists/pendingTypes';
import { sourceNote } from './sourceNote';

const flag = (count, busyText, clearText) => (count == null
  ? {}
  : { delta: count > 0 ? busyText : clearText, deltaType: count > 0 ? 'negative' : 'positive' });

/**
 * @param {{ invoices: { status: string, data: Object|null }, pending: { status: string, data: Object|null }, delayed: { status: string, data: Object|null }, sla: { status: string, data: Object|null }, projectStatus: string, money: (v: number) => string, }} props
 */
export default function SummaryCards({ invoices, pending, delayed, sla, projectStatus, money }) {
  const t = useTranslations('dashboard');
  const clear = t('tiles.allClear');
  const waiting = pending.data ? pending.data.byType.reduce((sum, t) => sum + t.count, 0) : null;
  const lateCycles = delayed.data?.total ?? null;
  const lateTasks = sla.data?.total ?? null;

  const tiles = [
    {
      id: 'collected',
      label: t('tiles.collectedIn', { year: new Date().getFullYear() }),
      value: invoices.data?.collectedThisYear ?? null,
      format: money,
      icon: BanknoteIcon,
      accent: SERIES_ROLE.collected,
      footnote: sourceNote(t, invoices, t('tiles.collectedNote'), t('tiles.noInvoiceAccess')),
      href: invoices.status === 'forbidden' ? null : ROUTES.INVOICES_WITH_STATUS(INVOICE_STATUS_ID.COLLECTED),
    },
    {
      id: 'delayed',
      label: t('tiles.delayedCycles'),
      value: lateCycles,
      icon: CalendarX,
      accent: STATUS.serious,
      ...flag(lateCycles, t('tiles.behindPlan'), clear),
      footnote: sourceNote(t, delayed, t('tiles.acrossBoqs', { count: delayed.data?.boqCount ?? 0 }), t('tiles.noBoqAccess')),
      href: delayed.status === 'forbidden' ? null : withProjectStatus(ROUTES.DASHBOARD_DELAYED_CYCLES, projectStatus),
    },
    {
      id: 'pending',
      label: t('tiles.pendingApprovals'),
      value: waiting,
      icon: Clock,
      accent: STATUS.warning,
      ...flag(waiting, t('tiles.actionRequired'), clear),
      footnote: sourceNote(t, pending, pendingBreakdown(t, pending.data?.byType ?? []) || t('tiles.nothingWaiting')),
      href: pending.status === 'forbidden' ? null : withProjectStatus(ROUTES.DASHBOARD_PENDING_APPROVALS, projectStatus),
    },
    {
      id: 'sla',
      label: t('tiles.slaViolations'),
      value: lateTasks,
      icon: AlertTriangle,
      accent: STATUS.critical,
      ...flag(lateTasks, t('tiles.pastDue'), clear),
      footnote: sourceNote(t, sla, t('tiles.tasksPastDue'), t('tiles.noWorkflowAccess')),
      href: sla.status === 'forbidden' ? null : withProjectStatus(ROUTES.DASHBOARD_SLA_VIOLATIONS, projectStatus),
    },
  ];

  return (
    <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map(({ id, ...tile }) => <KpiTile key={id} {...tile} />)}
    </Reveal>
  );
}
