'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import RunHeader from '@/components/workflow/runs/detail/RunHeader';
import RunBanners from '@/components/workflow/runs/detail/RunBanners';
import RunFacts from '@/components/workflow/runs/detail/RunFacts';
import RunTasksPanel from '@/components/workflow/runs/detail/RunTasksPanel';
import RunHistoryPanel from '@/components/workflow/runs/detail/RunHistoryPanel';
import RunDialogs from '@/components/workflow/runs/detail/RunDialogs';
import { useRunDetail } from '@/components/workflow/runs/detail/useRunDetail';
import { useRunActions } from '@/components/workflow/runs/detail/useRunActions';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { ROUTES } from '@/constants/routes';
import { groupTasks } from '@/lib/runDetail';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Admin' },
  { label: 'Monitoring', href: ROUTES.MONITORING_RUNS },
];

/** The page around a message, while there is no run to show. */
function Placeholder({ breadcrumbs, children }) {
  return (
    <div>
      <PageHeader title="Run" breadcrumbs={breadcrumbs} />
      <Card>{children}</Card>
    </div>
  );
}

/**
 * One run, in full: its state, its tasks and its history. Each part lives in
 * components/workflow/runs/detail/ — this only picks what to show.
 *
 * Built only after a real run existed, on purpose: it draws shapes — the
 * history, the tasks, `branches`, the return path — that are all null or empty
 * on a workflow that has never run, so building it blind would have been
 * several guesses at once with nothing able to contradict any of them.
 */
export default function RunDetailPage() {
  const params = useParams();
  const instanceId = params?.instanceId;

  const detail = useRunDetail(instanceId);
  const { run, error, history } = detail;
  const actions = useRunActions({ instanceId, run, load: detail.load });

  if (!detail.canView) {
    return (
      <Placeholder>
        <p className="text-xs" style={{ color: CHROME.textSecondary }}>
          You do not have permission to view workflow runs.
        </p>
      </Placeholder>
    );
  }

  // Anything but a loaded run for THIS id waits. The fetch is fired on arrival,
  // so this is the state the page opens in.
  if (!run && !error) {
    return (
      <Placeholder breadcrumbs={BREADCRUMBS}>
        <div className="flex flex-col items-center gap-2 py-16">
          <LoadingSpinner />
          <p className="text-[11px]" style={{ color: CHROME.textMuted }}>Loading this run…</p>
        </div>
      </Placeholder>
    );
  }

  if (!run) {
    return (
      <Placeholder>
        <p className="rounded-md px-2 py-1.5 text-xs" style={{ backgroundColor: withAlpha(STATUS.critical, 0.1), color: CHROME.textSecondary }}>
          {error}
        </p>
        <Link href={ROUTES.MONITORING_RUNS}>
          <Button variant="outline" size="sm" className="mt-3">Back to monitoring</Button>
        </Link>
      </Placeholder>
    );
  }

  const grouped = groupTasks(detail.tasks);

  return (
    <div>
      <RunHeader run={run} loading={detail.loading} busy={detail.busy} onRefresh={detail.load} actions={actions} />
      <RunBanners run={run} history={history} />
      <RunFacts run={run} targetTypeKey={detail.targetTypeKey} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RunTasksPanel grouped={grouped} loaded={detail.tasksLoaded} onReassign={actions.askToReassign} />
        <RunHistoryPanel run={run} history={history} loaded={detail.historyLoaded} openTasks={grouped.open} />
      </div>

      <RunDialogs
        run={run}
        instanceId={instanceId}
        busy={detail.busy}
        openTaskCount={grouped.open.length}
        actions={actions}
      />
    </div>
  );
}
