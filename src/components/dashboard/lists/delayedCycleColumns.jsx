import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import { formatDate } from '@/utils/formatters';
import LateBadge from '../LateBadge';
import ProjectCell from './ProjectCell';
import ViewLink from './ViewLink';

/** Where a late cycle opens: its BOQ item. */
export const delayedCycleHref = (row) => ROUTES.PROJECT_BOQ_ITEM(encodeURIComponent(row.projectCode ?? ''), row.boqItemId);

/** The columns of the delayed BOQ cycles table. */
export function delayedCycleColumns() {
  return [
    { key: 'projectCode', label: 'Project', render: (code, row) => <ProjectCell code={code} name={row.projectName} /> },
    {
      key: 'itemName',
      label: 'BOQ item',
      render: (val) => <span className="text-sm font-medium" style={{ color: CHROME.textPrimary }}>{val || '—'}</span>,
    },
    {
      key: 'cycleNumber',
      label: 'Cycle',
      render: (val, row) => <span className="text-sm tabular-nums" style={{ color: CHROME.textSecondary }}>{val} of {row.totalCycles}</span>,
    },
    {
      key: 'plannedDate',
      label: 'Planned',
      render: (val) => <span className="text-sm" style={{ color: CHROME.textMuted }}>{formatDate(val) || '—'}</span>,
    },
    { key: 'daysLate', label: 'Late', render: (val) => <LateBadge days={val} /> },
    { key: 'actions', label: '', resizable: false, render: (_, row) => <ViewLink href={delayedCycleHref(row)} /> },
  ];
}
