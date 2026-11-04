import { CHROME } from '@/theme/vizPalette';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import PendingStatusBadge from './PendingStatusBadge';
import ProjectCell from './ProjectCell';
import ViewLink from './ViewLink';
import { pendingHref, pendingTitle, pendingType } from './pendingTypes';

/**
 * @param {{ currency: string }} options
 */
export function pendingApprovalColumns({ currency }) {
  return [
    {
      key: 'type',
      label: 'Kind',
      render: (val) => {
        const kind = pendingType(val);
        const Icon = kind?.icon;
        return (
          <span className="flex items-center gap-1.5 text-sm" style={{ color: CHROME.textSecondary }}>
            {Icon && <Icon size={13} aria-hidden="true" />}
            {kind?.single ?? val}
          </span>
        );
      },
    },
    {
      key: 'title',
      label: 'Reference',
      render: (_, row) => <span className="font-mono text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{pendingTitle(row)}</span>,
    },
    { key: 'projectCode', label: 'Project', render: (code, row) => <ProjectCell code={code} name={row.projectName} /> },
    { key: 'statusId', label: 'Status', render: (val, row) => <PendingStatusBadge type={row.type} statusId={val} /> },
    {
      key: 'stageTitle',
      label: 'Stage',
      render: (val) => (val
        ? <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val}</span>
        : <span className="text-xs italic" style={{ color: CHROME.textMuted }}>No live run</span>),
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
          {val == null ? '—' : formatCurrency(val, currency)}
        </span>
      ),
    },
    {
      key: 'submittedOn',
      label: 'Submitted',
      render: (val) => <span className="text-sm" style={{ color: CHROME.textMuted }}>{formatDateTime(val) || '—'}</span>,
    },
    { key: 'actions', label: '', resizable: false, render: (_, row) => <ViewLink href={pendingHref(row)} /> },
  ];
}
