import { CHROME } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';
import PendingStatusBadge from './PendingStatusBadge';
import ProjectCell from './ProjectCell';
import ViewLink from './ViewLink';
import { pendingHref, pendingTitle, pendingType, pendingTypeName } from './pendingTypes';

/**
 * @param {{ currency: string, t: (key: string, values?: Object) => string, format: ReturnType<import('@/hooks/useLocaleFormat').useLocaleFormat> }} options
 */
export function pendingApprovalColumns({ currency, t, format }) {
  return [
    {
      key: 'type',
      label: t('pending.columns.kind'),
      render: (val) => {
        const Icon = pendingType(val)?.icon;
        return (
          <span className="flex items-center gap-1.5 text-sm" style={{ color: CHROME.textSecondary }}>
            {Icon && <Icon size={13} aria-hidden="true" />}
            {pendingTypeName(t, val, 'single')}
          </span>
        );
      },
    },
    {
      key: 'title',
      label: t('pending.columns.reference'),
      render: (_, row) => <span dir="ltr" className="font-mono text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{pendingTitle(t, row)}</span>,
    },
    { key: 'projectCode', label: t('pending.columns.project'), render: (code, row) => <ProjectCell code={code} name={row.projectName} /> },
    { key: 'statusId', label: t('pending.columns.status'), render: (val, row) => <PendingStatusBadge type={row.type} statusId={val} /> },
    {
      key: 'stageTitle',
      label: t('pending.columns.stage'),
      render: (val) => (val
        ? <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val}</span>
        : <span className="text-xs italic" style={{ color: CHROME.textMuted }}>{t('pending.noLiveRun')}</span>),
    },
    {
      key: 'amount',
      label: t('pending.columns.amount'),
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
          {val == null ? '—' : formatCurrency(val, currency)}
        </span>
      ),
    },
    {
      key: 'submittedOn',
      label: t('pending.columns.submitted'),
      render: (val) => <span className="text-sm" style={{ color: CHROME.textMuted }}>{format.dateTime(val) || '—'}</span>,
    },
    { key: 'actions', label: '', resizable: false, render: (_, row) => <ViewLink href={pendingHref(row)} /> },
  ];
}
