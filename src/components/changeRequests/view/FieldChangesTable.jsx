'use client';

import { useSelector } from 'react-redux';

import Table from '@/components/common/Table';
import { CR_TARGET } from '@/constants/changeRequests';
import { formatChangeValue } from '@/lib/changeRequest/formatValue';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { CHROME } from '@/theme/vizPalette';

/**
 * Every field a change request changes, old → new, as the server read the old
 * values when it was raised.
 *
 * @param {{ changes: Array }} props
 */
export default function FieldChangesTable({ changes }) {
  const currency = useSelector((s) => s.ui.currency);
  const frequencies = useSelector(selectBillingFrequencies);
  const show = (fieldName, value) => formatChangeValue(fieldName, value, { currency, frequencies });

  const columns = [
    {
      key: 'targetName',
      label: 'Changes to',
      render: (name, c) => (
        <span className="text-xs" style={{ color: CHROME.textPrimary }}>
          {name || c.targetId}
          <span className="block text-[11px]" style={{ color: CHROME.textMuted }}>
            {c.targetTypeKey === CR_TARGET.PROJECT ? 'EPM project' : 'BOQ item'}
          </span>
        </span>
      ),
    },
    { key: 'fieldLabel', label: 'Field', render: (label) => <span className="text-xs">{label}</span> },
    {
      key: 'oldValue',
      label: 'From',
      render: (value, c) => <span className="text-xs line-through" style={{ color: CHROME.textMuted }}>{show(c.fieldName, value)}</span>,
    },
    {
      key: 'newValue',
      label: 'To',
      render: (value, c) => <span className="text-xs font-medium" style={{ color: CHROME.textPrimary }}>{show(c.fieldName, value)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5">
      <p
        className="mb-2 text-sm font-semibold"
        style={{ color: CHROME.textPrimary }}
      >
        Field changes
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
        emptyMessage="No field changes."
      />
    </div>
  );
}
