import { StatusBadge } from '@/components/common/Badge';
import { CHROME } from '@/theme/vizPalette';

/** The Projects page's table columns. */
export const PROJECT_COLUMNS = [
  {
    key: 'contractName',
    label: 'Contract Name',
    render: (val, row) => (
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight" style={{ color: CHROME.textPrimary }}>
          {val ?? '—'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" style={{ color: CHROME.textMuted }}>
          <span className="font-mono">{row.projectCode}</span>
          {row.contractNumber != null && <span className="font-mono">· #{row.contractNumber}</span>}
        </div>
        {(row.projectName || row.projectNameFocus) && (
          <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
            {row.projectName ? `EPM: ${row.projectName}` : ''}
            {row.projectName && row.projectNameFocus ? ' · ' : ''}
            {row.projectNameFocus ? `Focus: ${row.projectNameFocus}` : ''}
          </p>
        )}
      </div>
    ),
  },
  { key: 'clientName', label: 'Client' },
  { key: 'poNumber', label: 'PO Number' },
  { key: 'invoicingPlatform', label: 'Invoicing Platform' },
  {
    key: 'status',
    label: 'Status',
    render: (val) => <StatusBadge status={val} />,
  },
];
