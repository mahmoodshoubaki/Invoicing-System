'use client';

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import { Banknote, History, LayoutList, Plus, Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import BOQItemHistoryModal from '@/components/boq/BOQItemHistoryModal';
import TabToolbar from './TabToolbar';
import { CHROME, SERIES_ROLE } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { usePermission } from '@/hooks/usePermission';
import { ROUTES } from '@/constants/routes';

function BOQTab({
  projectCode, boqItems, currentBOQ, billingFrequenciesMap, boqItemStatusesMap, boqItemStatusColorsMap, currency,
}) {
  const t = useTranslations('boq');
  const format = useLocaleFormat();
  const frequencyLabel = useLookupLabel('billingFrequency');
  const { can } = usePermission();
  const [historyItemId, setHistoryItemId] = useState(null);
  const money = (v) => formatCurrency(v, currency);
  const encoded = encodeURIComponent(projectCode);

  const totalCost = useMemo(() => boqItems.reduce((sum, i) => sum + (i.totalCost || 0), 0), [boqItems]);

  const stats = useMemo(() => [
    {
      label: t('stats.items'),
      value: boqItems.length,
      icon: LayoutList,
      accent: SERIES_ROLE.wip,
    },
    {
      label: t('stats.totalValue'),
      value: money(totalCost),
      icon: Banknote,
      accent: SERIES_ROLE.revenue,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [boqItems.length, totalCost, currency, t]);

  const columns = useMemo(() => [
    {
      key: 'englishName',
      label: t('columns.item'),
      render: (val, row) => (
        <div>
          <Link
            href={ROUTES.PROJECT_BOQ_ITEM(encoded, row.id)}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold leading-tight underline-offset-2 hover:underline"
            style={{ color: CHROME.textPrimary }}
          >
            {val ?? '—'}
          </Link>
          {row.arabicName && (
            <p className="mt-0.5 truncate text-xs" dir="rtl" style={{ color: CHROME.textMuted }}>
              {row.arabicName}
            </p>
          )}
        </div>
      ),
    },
    { key: 'quantity', label: t('columns.qty'), align: 'center' },
    {
      key: 'unitCost',
      label: t('columns.unitCost'),
      align: 'right',
      render: (val) => <span className="text-sm tabular-nums">{money(val)}</span>,
    },
    {
      key: 'totalCost',
      label: t('columns.totalCost'),
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
          {money(val)}
        </span>
      ),
    },
    {
      key: 'statusId',
      label: t('columns.status'),
      align: 'center',
      sortable: false,
      render: (val) => (
        <StatusBadge status={boqItemStatusesMap[val] ?? '—'} colors={boqItemStatusColorsMap[val]} />
      ),
    },
    {
      key: 'baselineInvoicingDate',
      label: t('columns.baselineDate'),
      align: 'center',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textMuted }}>{format.date(val) || '—'}</span>
      ),
    },
    {
      key: 'expectedInvoicingDate',
      label: t('columns.expectedDate'),
      align: 'center',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>{format.date(val) || '—'}</span>
      ),
    },
    {
      key: 'billingFrequencyId',
      label: t('columns.billing'),
      align: 'center',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>
          {frequencyLabel(billingFrequenciesMap[val]) ?? '—'}
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
            title={t('actions.revisionHistory')}
          />
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currency, boqItemStatusesMap, boqItemStatusColorsMap, billingFrequenciesMap, encoded, t, format, frequencyLabel]);

  const actions = currentBOQ?.id ? (
    <Link href={`/projects/${encoded}/boq`}>
      <Button variant="outline" size="sm" icon={Settings2}>{t('actions.manage')}</Button>
    </Link>
  ) : can('Boqs', 'Create') ? (
    <Link href={`/projects/${encoded}/boq/new`}>
      <Button size="sm" icon={Plus}>{t('actions.addFirstItem')}</Button>
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
        emptyMessage={t('tabEmpty')}
      />
    </div>
  );
}

export default memo(BOQTab);
