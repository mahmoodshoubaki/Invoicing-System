import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import { formatDateTime } from '@/utils/formatters';
import LateBadge from '../LateBadge';
import ProjectCell from './ProjectCell';
import ViewLink from './ViewLink';

/** Where a past-due task opens: its workflow run. */
export const slaViolationHref = (row) => ROUTES.MONITORING_RUN(row.instanceId);

/** The columns of the SLA violations table. */
export function slaViolationColumns() {
  return [
    {
      key: 'taskTitle',
      label: 'Task',
      render: (val) => <span className="text-sm font-medium" style={{ color: CHROME.textPrimary }}>{val || '—'}</span>,
    },
    { key: 'projectCode', label: 'Project', render: (code, row) => <ProjectCell code={code} name={row.projectName} /> },
    {
      key: 'stage',
      label: 'Stage',
      render: (val) => <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val || '—'}</span>,
    },
    {
      key: 'assignees',
      label: 'Assigned to',
      render: (val) => <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val.length > 0 ? val.join(', ') : 'Nobody'}</span>,
    },
    {
      key: 'dueOn',
      label: 'Due',
      render: (val) => <span className="text-sm" style={{ color: CHROME.textMuted }}>{formatDateTime(val) || '—'}</span>,
    },
    { key: 'daysLate', label: 'Late', render: (val) => <LateBadge days={val} /> },
    { key: 'actions', label: '', resizable: false, render: (_, row) => <ViewLink href={slaViolationHref(row)} label="Open run" /> },
  ];
}
