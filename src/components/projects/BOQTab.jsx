'use client';

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import { Banknote, CheckCircle2, History, LayoutList, Plus, Settings2 } from 'lucide-react';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import BOQItemHistoryModal from '@/components/boq/BOQItemHistoryModal';
import TabToolbar from './TabToolbar';
import { CHROME, SERIES_ROLE, STATUS } from '@/theme/vizPalette';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { usePermission } from '@/hooks/usePermission';
import { BOQ_STATUS } from '@/constants/statuses';

function BOQTab({
  projectCode, boqItems, currentBOQ, billingFrequenciesMap, boqItemStatusesMap, boqItemStatusColorsMap, currency,
}) {
  const { can } = usePermission();
  // Owned here rather than lifted to the page — opening/closing this modal
  // now only re-renders this tab, not the stat cards or tab nav above it.
  const [historyItemId, setHistoryItemId] = useState(null);
  const money = (v) => formatCurrency(v, currency);
  const encoded = encodeURIComponent(projectCode);

  const summary = useMemo(() => {
    const totalCost = boqItems.reduce((sum, i) => sum + (i.totalCost || 0), 0);
    const invoiced = boqItems.filter(
      (i) => boqItemStatusesMap[i.statusId] === BOQ_STATUS.INVOICED
    ).length;
    return { totalCost, invoiced };
  }, [boqItems, boqItemStatusesMap]);

  const stats = useMemo(() => [
    {
      label: 'BOQ items',
      value: boqItems.length,
      icon: LayoutList,
      accent: SERIES_ROLE.wip,
    },
    {
      label: 'Total value',
      value: money(summary.totalCost),
      icon: Banknote,
      accent: SERIES_ROLE.revenue,
    },
    {
      label: 'Invoiced',
      value: `${summary.invoiced} / ${boqItems.length}`,
      icon: CheckCircle2,
      accent: STATUS.good,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [boqItems.length, summary, currency]);

  const columns = useMemo(() => [
    {
      key: 'englishName',
      label: 'Item',
      render: (val, row) => (
        <div className="w-xs min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: CHROME.textPrimary }}>
            {val ?? '—'}
          </p>
          {row.arabicName && (
            <p className="mt-0.5 truncate text-xs" dir="rtl" style={{ color: CHROME.textMuted }}>
              {row.arabicName}
            </p>
          )}
        </div>
      ),
    },
    { key: 'quantity', label: 'Qty', align: 'center' },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      align: 'right',
      render: (val) => <span className="text-sm tabular-nums">{money(val)}</span>,
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
          {money(val)}
        </span>
      ),
    },
    {
      key: 'statusId',
      label: 'Status',
      align: 'center',
      sortable: false,
      render: (val) => (
        <StatusBadge status={boqItemStatusesMap[val] ?? '—'} colors={boqItemStatusColorsMap[val]} />
      ),
    },
    {
      key: 'baselineInvoicingDate',
      label: 'Baseline Date',
      align: 'center',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textMuted }}>{formatDate(val) || '—'}</span>
      ),
    },
    {
      key: 'expectedInvoicingDate',
      label: 'Expected Date',
      align: 'center',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>{formatDate(val) || '—'}</span>
      ),
    },
    {
      key: 'billingFrequencyId',
      label: 'Billing',
      align: 'center',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>
          {billingFrequenciesMap[val] ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'center',
      sortable: false,
      resizable: false,
      render: (_, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="xs"
            icon={History}
            onClick={() => setHistoryItemId(row.id)}
            title="Revision history"
          />
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currency, boqItemStatusesMap, boqItemStatusColorsMap, billingFrequenciesMap]);

  const actions = currentBOQ?.id ? (
    <Link href={`/projects/${encoded}/boq`}>
      <Button variant="outline" size="sm" icon={Settings2}>Manage BOQ</Button>
    </Link>
  ) : can('Boqs', 'Create') ? (
    <Link href={`/projects/${encoded}/boq/new`}>
      <Button size="sm" icon={Plus}>Add first item</Button>
    </Link>
  ) : null;

  return (
    <div>
      <BOQItemHistoryModal
        open={historyItemId != null}
        onClose={() => setHistoryItemId(null)}
        boqItemId={historyItemId}
      />

      <TabToolbar stats={stats} actions={actions} />

      <Table
        columns={columns}
        data={boqItems}
        rowKey="id"
        emptyMessage="No BOQ items have been added to this project yet."
      />
    </div>
  );
}

export default memo(BOQTab);
