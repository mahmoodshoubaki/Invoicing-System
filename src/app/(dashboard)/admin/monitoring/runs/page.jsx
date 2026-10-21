'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { AlarmClock, AlertTriangle, ArrowRight, Moon, RefreshCw, RotateCcw, SearchX } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ResumeDialog from '@/components/workflow/runs/ResumeDialog';
import ProjectLink from '@/components/workflow/ProjectLink';
import { usePermission } from '@/hooks/usePermission';
import { usePolling } from '@/hooks/usePolling';
import { useToast } from '@/hooks/useToast';
import { allow, WORKFLOW_PERMISSIONS, WORKFLOW_INSTANCE_PERMISSIONS } from '@/constants/workflowPermissions';
import { INSTANCE_STATUS, INSTANCE_STATUS_COLORS, INSTANCE_STATUS_LABELS } from '@/constants/workflow';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';
import {
  advanceInstance, fetchInstances, resumeInstance, didAdvance, runAction,
  selectInstances, selectInstancesLoading,
  selectInstancesError, selectInstancesLoaded, selectIsAdvancing, selectInstancesTotal,
} from '@/store/slices/workflowRunsSlice';

/** Runs a page to start with — the reader can choose another. */
const RUNS_PAGE_SIZE = 50;
import TargetLinks from '@/components/workflow/TargetLinks';
import TablePagination from '@/components/common/TablePagination';
import { pageInfo } from '@/lib/pageInfo';
import { faultedAgain } from '@/lib/runVariables';
import { selectDefinitions } from '@/store/slices/workflowSlice';

/** No push, so this is the only way the screen learns anything changed. */
const POLL_INTERVAL_MS = 30_000;

/**
 * Faulted first — this screen exists to answer "what is stuck?", and a run that
 * gave up is the only thing on it that will never move again on its own.
 */
const FILTERS = [
  { key: 'all', label: 'All', statusKey: null },
  { key: 'faulted', label: 'Faulted', statusKey: INSTANCE_STATUS.FAULTED },
  // Beside Faulted rather than beside Completed: both are runs that have
  // stopped and can be picked back up, and the same Resume button serves them.
  { key: 'paused', label: 'Paused', statusKey: INSTANCE_STATUS.PAUSED },
  { key: 'cancelled', label: 'Cancelled', statusKey: INSTANCE_STATUS.CANCELLED },
  { key: 'running', label: 'Running', statusKey: INSTANCE_STATUS.RUNNING },
  { key: 'completed', label: 'Completed', statusKey: INSTANCE_STATUS.COMPLETED },
];

/** The clocks, when they apply — a sleeping run and a stuck one look identical without them. */
function Clocks({ run }) {
  return (
    <>
      {run.delayUntil && (
        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: CHROME.textMuted }}>
          <Moon size={10} aria-hidden="true" />
          asleep until {formatDate(run.delayUntil)}
        </span>
      )}
      {run.stageDeadlineOn && (
        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: STATUS.warning }}>
          <AlarmClock size={10} aria-hidden="true" />
          escalates {formatDate(run.stageDeadlineOn)}
        </span>
      )}
    </>
  );
}

/**
 * Workflow runs (Admin › Monitoring) — every run, and the one button each one's status allows.
 *
 * Split out from the engine admin page: what the engine will tolerate is a
 * settings question and belongs with an administrator, while what a run is
 * doing right now is an operational one and is looked at far more often.
 */
export default function WorkflowRunsPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { can } = usePermission();

  const canView = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW);
  const canRun = allow(can, WORKFLOW_PERMISSIONS.RUN);

  const runs = useSelector(selectInstances);
  const loading = useSelector(selectInstancesLoading);
  const loaded = useSelector(selectInstancesLoaded);
  const error = useSelector(selectInstancesError);
  const busy = useSelector(selectIsAdvancing);

  const [filter, setFilter] = useState('all');
  /*
   * Paged by the server (2026-10-21) — it used to show the first 50 and no
   * more. A new tab or a new size starts at page 1; the page is clamped to the
   * last there is, so runs finishing off the last page never leave it empty.
   */
  const total = useSelector(selectInstancesTotal);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(RUNS_PAGE_SIZE);
  const current = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
  const changePageSize = useCallback((next) => {
    setPageSize(next);
    setPage(1);
  }, []);
  const pagination = loaded && !error && runs.length > 0
    ? pageInfo(current, pageSize, total, setPage, changePageSize)
    : undefined;
  const [resuming, setResuming] = useState(null);

  const definitions = useSelector(selectDefinitions);

  const statusKey = useMemo(() => FILTERS.find((f) => f.key === filter)?.statusKey ?? null, [filter]);

  const load = useCallback(() => {
    dispatch(fetchInstances({ statusKey, skip: (current - 1) * pageSize, take: pageSize }));
  }, [dispatch, statusKey, current, pageSize]);

  // `usePolling` does NOT fire on mount — its first tick is a whole interval
  // away — so without this the page sat on "No runs here" for 30 seconds
  // before any request was made.
  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  usePolling(load, POLL_INTERVAL_MS, canView);

  /*
   * `failureReason` is on the list row as of 2026-09-13, so this no longer
   * fetches the whole run first.
   *
   * It used to have to: the reason text is the only signal that the loop guard
   * is what stopped a run, and that decides whether the dialog offers to reset
   * the step count. Deciding it off a row that did not carry the reason would
   * have meant offering the reset blind, or never offering it at all.
   */
  const openResume = useCallback((run) => {
    setResuming(run);
  }, []);

  // As on the run's page: a refused value stays in the dialog, and a run that
  // faults again on a corrected value says so.
  const handleResume = useCallback(async ({ notes, resetStepCount, variableChanges }) => {
    const run = resuming;
    const result = await dispatch(resumeInstance({ instanceId: run.instanceId, notes, resetStepCount, variableChanges }));

    if (resumeInstance.rejected.match(result)) {
      toast.error('Could not resume this run', result.payload);
      return { errors: result.meta?.errors ?? null };
    }

    setResuming(null);
    const again = faultedAgain(result.payload);
    if (again) toast.error(`${run.definitionCode ?? 'The run'} resumed, but stopped again`, again);
    else toast.success('Run resumed', run.definitionCode);
    load();
    return null;
  }, [dispatch, load, resuming, toast]);

  const handleAdvance = useCallback(async (run) => {
    const result = await dispatch(advanceInstance({ instanceId: run.instanceId }));

    if (advanceInstance.rejected.match(result)) {
      toast.error('Could not advance this run', result.payload);
      return;
    }

    // A 200 is not proof of movement — saying "advanced" to somebody whose run
    // sat still is worse than saying nothing.
    if (didAdvance(run, result.payload)) toast.success('Run advanced', run.definitionCode);
    else toast.info('Nothing moved', 'It is waiting on something — a person, a delay, or a deadline.');

    load();
  }, [dispatch, load, toast]);

  if (!canView) {
    return (
      <div>
        <PageHeader title="Workflow runs" />
        <Card>
          <p
            className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs"
            style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
          >
            <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
            You do not have permission to view workflow runs.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Workflow runs"
        subtitle="What is running, what is stuck, and what gave up."
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} loading={loading} onClick={load}>
            Refresh
          </Button>
        }
      />

      <Card className="mb-4" padding={false}>
        <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
          {FILTERS.map((tab) => {
            const on = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setFilter(tab.key); setPage(1); }}
                aria-pressed={on}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: on ? withAlpha(STATUS.info, 0.12) : '#f6f5f3',
                  color: on ? STATUS.info : CHROME.textMuted,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {error ? (
        <Card>
          <p
            className="rounded-md px-2 py-1.5 text-xs"
            style={{ backgroundColor: withAlpha(STATUS.critical, 0.1), color: CHROME.textSecondary }}
          >
            {error}
          </p>
        </Card>
      ) : !loaded ? (
        /*
          Until a result for THIS filter has actually arrived. Keyed on `loaded`
          rather than on `loading && runs.length === 0`, because that pair is
          false in the two moments that matter: before the first request is
          made, and while a filter change is in flight with the previous
          filter's rows still in the store. Both used to render "No runs here"
          over a question nobody had answered yet.
        */
        <div className="flex flex-col items-center gap-2 py-20">
          <LoadingSpinner />
          <p className="text-[11px]" style={{ color: CHROME.textMuted }}>Loading runs…</p>
        </div>
      ) : runs.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title={filter === 'faulted' ? 'Nothing has faulted' : 'No runs here'}
            description={
              filter === 'faulted'
                ? 'Good. A run only lands here once it has given up.'
                : 'Nothing matches this filter yet.'
            }
          />
        </Card>
      ) : (
        <Card padding={false}>
          <ul className="flex flex-col">
            {runs.map((run) => {
              const color = INSTANCE_STATUS_COLORS[run.statusKey] ?? CHROME.textMuted;
              const action = runAction(run);

              return (
                <li
                  key={run.instanceId}
                  className="relative flex flex-wrap items-start gap-3 border-b border-[#f1f0ee] px-4 py-3 transition-colors last:border-0 hover:bg-[#fbfaf9]"
                >
                  {/*
                    The whole row opens the run, not just the code — a row that
                    looks like a target for the pointer should be one.

                    Done as a stretched overlay rather than by wrapping the row
                    in a Link, because the row holds its own buttons and an
                    anchor containing a button is invalid and swallows the
                    click. The overlay sits above the (non-interactive) text and
                    below the buttons, so Advance and Resume still work.
                  */}
                  <Link
                    href={ROUTES.MONITORING_RUN(run.instanceId)}
                    aria-label={`Open run ${run.definitionCode ?? ""}`}
                    className="absolute inset-0 z-10 rounded-lg focus-visible:outline-2"
                    style={{ outlineColor: STATUS.info }}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className="flex flex-wrap items-center gap-2 text-xs font-medium"
                      style={{ color: CHROME.textPrimary }}
                    >
                      {run.definitionCode}
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: withAlpha(color, 0.12),
                          color,
                        }}
                      >
                        {INSTANCE_STATUS_LABELS[run.statusKey] ?? run.status}
                      </span>
                    </p>

                    <p
                      className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
                      style={{ color: CHROME.textMuted }}
                    >
                      <span>
                        v{run.definitionVersion}
                        {run.currentStageTitle && ` · ${run.currentStageTitle}`}
                      </span>
                      {/* Sits above the row's stretched link (ProjectLink carries its
                          own z-index and stops the click), so it opens the project
                          rather than the run. */}
                      <TargetLinks
                        targetTypeKey={run?.targetTypeKey ?? definitions.find((d) => d.code === run?.definitionCode)?.targetTypeKey ?? null}
                        targetIds={run.targetIds}
                        projectCode={run.projectCode}
                        size="xs"
                      />
                      <ProjectLink projectCode={run.projectCode} size="xs" />
                      {run.startedOn && (
                        <span>started {formatDateTime(run.startedOn)}</span>
                      )}
                      {run.pendingTaskCount > 0 && (
                        <span>
                          {run.pendingTaskCount} to-do
                          {run.pendingTaskCount === 1 ? "" : "s"}
                        </span>
                      )}
                      <Clocks run={run} />
                    </p>

                    {run.failureReason && (
                      <p
                        className="mt-1 text-[11px] leading-snug"
                        style={{ color: STATUS.critical }}
                      >
                        {run.failureReason}
                      </p>
                    )}
                  </div>

                  {/* Above the row overlay (z-20 over z-10), or the link would
                      swallow the click and open the run instead of acting on it.

                      One button, chosen by status. They are not interchangeable:
                      advancing a faulted run answers 200 and does nothing. */}
                  {canRun && action === "resume" && (
                    <div className="relative z-20">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={RotateCcw}
                        onClick={() => openResume(run)}
                      >
                        Resume
                      </Button>
                    </div>
                  )}
                  {canRun && action === "advance" && (
                    <div className="relative z-20">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={ArrowRight}
                        loading={busy}
                        onClick={() => handleAdvance(run)}
                      >
                        Advance
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      {pagination && <TablePagination {...pagination} busy={loading} />}

      {/* Mounted per run so the note and the checkbox start clean each time. */}
      {resuming && (
        <ResumeDialog
          key={resuming.instanceId}
          instance={resuming}
          detail={resuming}
          loadingDetail={false}
          open
          busy={busy}
          onClose={() => setResuming(null)}
          onConfirm={handleResume}
        />
      )}
    </div>
  );
}
