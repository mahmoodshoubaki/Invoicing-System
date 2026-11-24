'use client';

import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import Table from '@/components/common/Table';
import { CR_TARGET } from '@/constants/changeRequests';
import { formatChangeValue } from '@/lib/changeRequest/formatValue';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { CHROME } from '@/theme/vizPalette';

/**
 * @param {{ changes: Array }} props
 */
export default function FieldChangesTable({ changes }) {
  const t = useTranslations('changeRequests.fieldChanges');
  const format = useLocaleFormat();
  const areaLabel = useLookupLabel('changeRequests.areas');
  const frequencyLabel = useLookupLabel('billingFrequency');
  const currency = useSelector((s) => s.ui.currency);
  const frequencies = useSelector(selectBillingFrequencies);
  const show = (fieldName, value) => formatChangeValue(fieldName, value, {
    currency, frequencies, frequencyLabel, formatDay: format.date, monthsLabel: (count) => t('months', { count }),
  });

  const columns = [
    {
      key: 'targetName',
      label: t('changesTo'),
      render: (name, c) => (
        <span className="text-xs" style={{ color: CHROME.textPrimary }}>
          {name || c.targetId}
          <span className="block text-[11px]" style={{ color: CHROME.textMuted }}>
            {c.targetTypeKey === CR_TARGET.PROJECT ? t('epmProject') : t('boqItem')}
          </span>
        </span>
      ),
    },
    { key: 'fieldLabel', label: t('field'), render: (label) => <span className="text-xs">{areaLabel(label)}</span> },
    {
      key: 'oldValue',
      label: t('from'),
      render: (value, c) => <span className="text-xs line-through" style={{ color: CHROME.textMuted }}>{show(c.fieldName, value)}</span>,
    },
    {
      key: 'newValue',
      label: t('to'),
      render: (value, c) => <span className="text-xs font-medium" style={{ color: CHROME.textPrimary }}>{show(c.fieldName, value)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5">
      <p
        className="mb-2 text-sm font-semibold"
        style={{ color: CHROME.textPrimary }}
      >
        {t('title')}
      </p>
      <Table
        columns={columns}
        data={changes.map((c, i) => ({
          ...c,
          rowId: `${c.targetTypeKey}:${c.targetId}:${c.fieldName}:${i}`,
        }))}
        rowKey="rowId"
        sortable={false}
        resizable={false}
        compact
        emptyMessage={t('empty')}
      />
    </div>
  );
}
