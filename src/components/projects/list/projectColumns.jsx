import { StatusBadge } from '@/components/common/Badge';
import { CHROME } from '@/theme/vizPalette';

/**
 * @param {(key: string, values?: Object) => string} t translator for the `projects` namespace
 * @param {(status: string) => string} statusLabel
 */
export function projectColumns(t, statusLabel) {
  return [
    {
      key: 'contractName',
      label: t('list.columns.contractName'),
      render: (val, row) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: CHROME.textPrimary }}>
            {val ?? '—'}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" style={{ color: CHROME.textMuted }}>
            <span dir="ltr" className="font-mono">{row.projectCode}</span>
            {row.contractNumber != null && <span dir="ltr" className="font-mono">· #{row.contractNumber}</span>}
          </div>
          {(row.projectName || row.projectNameFocus) && (
            <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
              {row.projectName ? t('list.epmName', { name: row.projectName }) : ''}
              {row.projectName && row.projectNameFocus ? ' · ' : ''}
              {row.projectNameFocus ? t('list.focusName', { name: row.projectNameFocus }) : ''}
            </p>
          )}
        </div>
      ),
    },
    { key: 'clientName', label: t('list.columns.client') },
    { key: 'poNumber', label: t('list.columns.poNumber'), render: (val) => (val ? <span dir="ltr">{val}</span> : '—') },
    { key: 'invoicingPlatform', label: t('list.columns.invoicingPlatform') },
    {
      key: 'status',
      label: t('list.columns.status'),
      render: (val) => <StatusBadge status={val} label={statusLabel(val)} />,
    },
  ];
}
