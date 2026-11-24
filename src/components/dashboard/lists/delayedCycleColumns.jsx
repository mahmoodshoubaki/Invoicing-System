import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import LateBadge from '../LateBadge';
import ProjectCell from './ProjectCell';
import ViewLink from './ViewLink';

export const delayedCycleHref = (row) => ROUTES.PROJECT_BOQ_ITEM(encodeURIComponent(row.projectCode ?? ''), row.boqItemId);

/**
 * @param {(key: string, values?: Object) => string} t translator for the `dashboard` namespace
 * @param {ReturnType<import('@/hooks/useLocaleFormat').useLocaleFormat>} format
 */
export function delayedCycleColumns(t, format) {
  return [
    { key: 'projectCode', label: t('delayed.columns.project'), render: (code, row) => <ProjectCell code={code} name={row.projectName} /> },
    { key: 'bdm', label: t('delayed.columns.bdm'), render: (val) => <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val || '—'}</span> },
    {
      key: 'businessUnit',
      label: t('delayed.columns.businessUnit'),
      render: (val) => <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val || '—'}</span>,
    },
    {
      key: 'itemName',
      label: t('delayed.columns.boqItem'),
      render: (val) => <span className="text-sm font-medium" style={{ color: CHROME.textPrimary }}>{val || '—'}</span>,
    },
    {
      key: 'cycleNumber',
      label: t('delayed.columns.cycle'),
      render: (val, row) => (
        <span className="text-sm tabular-nums" style={{ color: CHROME.textSecondary }}>
          {t('delayed.cycleCell', { number: val, total: row.totalCycles })}
        </span>
      ),
    },
    {
      key: 'plannedDate',
      label: t('delayed.columns.planned'),
      render: (val) => <span className="text-sm" style={{ color: CHROME.textMuted }}>{format.date(val) || '—'}</span>,
    },
    { key: 'daysLate', label: t('delayed.columns.late'), render: (val) => <LateBadge days={val} /> },
    { key: 'actions', label: '', resizable: false, render: (_, row) => <ViewLink href={delayedCycleHref(row)} /> },
  ];
}
