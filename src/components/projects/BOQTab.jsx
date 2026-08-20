'use client';

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import { History } from 'lucide-react';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import BOQItemHistoryModal from '@/components/boq/BOQItemHistoryModal';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { usePermission } from '@/hooks/usePermission';

function BOQTab({
  projectCode, boqItems, currentBOQ, billingFrequenciesMap, boqItemStatusesMap, boqItemStatusColorsMap, currency,
}) {
  const { can } = usePermission();
  // Owned here rather than lifted to the page — opening/closing this modal
  // now only re-renders this tab, not the stat cards or tab nav above it.
  const [historyItemId, setHistoryItemId] = useState(null);

  const columns = useMemo(() => [
    {
      key: 'englishName',
      label: 'Item',
      render: (val, row) => (
        <div className="w-xs">
          <p className="font-medium text-gray-800 text-sm">{val}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.arabicName}</p>
        </div>
      ),
    },
    { key: 'quantity', label: 'Qty', align: 'center' },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      align: 'center',
      render: (val) => formatCurrency(val, currency),
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      align: 'center',
      render: (val) => <span className="font-semibold">{formatCurrency(val, currency)}</span>,
    },
    {
      key: 'statusId',
      label: 'Status',
      align: 'center',
      sortable: false,
      render: (val) => <StatusBadge status={boqItemStatusesMap[val] ?? '—'} colors={boqItemStatusColorsMap[val]} />,
    },
    {
      key: 'baselineInvoicingDate',
      label: 'Baseline Expected Invoicing Date',
      align: 'center',
      render: (val) => formatDate(val),
    },
    {
      key: 'expectedInvoicingDate',
      label: 'Expected Invoicing Date',
      align: 'center',
      render: (val) => formatDate(val),
    },
    {
      key: 'billingFrequencyId',
      label: 'Billing Frequency',
      align: 'center',
      render: (val) => billingFrequenciesMap[val] ?? '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      sortable: false,
      render: (_, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="xs"
            icon={History}
            onClick={() => setHistoryItemId(row.id)}
            title="History"
          />
        </div>
      ),
    },
  ], [currency, boqItemStatusesMap, boqItemStatusColorsMap, billingFrequenciesMap]);

  return (
    <div>
      <BOQItemHistoryModal
        open={historyItemId != null}
        onClose={() => setHistoryItemId(null)}
        boqItemId={historyItemId}
      />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{boqItems.length} BOQ item{boqItems.length !== 1 ? 's' : ''}</p>
        {currentBOQ?.id ? (
          <Link href={`/projects/${encodeURIComponent(projectCode)}/boq`}>
            <Button variant="outline" size="sm">Manage BOQ</Button>
          </Link>
        ) : can('Boqs', 'Create') ? (
          <Link href={`/projects/${encodeURIComponent(projectCode)}/boq/new`}>
            <Button size="sm">Add First Item</Button>
          </Link>
        ) : null}
      </div>
      <Table columns={columns} data={boqItems} emptyMessage="No BOQ items for this project" />
    </div>
  );
}

export default memo(BOQTab);
