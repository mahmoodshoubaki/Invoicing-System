'use client';

import Link from 'next/link';
import { ArrowRight, ChevronLeft, CircleSlash, PauseCircle, RefreshCw, RotateCcw } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { INSTANCE_STATUS } from '@/constants/workflow';
import { ROUTES } from '@/constants/routes';
import { runAction } from '@/store/slices/workflowRunsSlice';

/**
 * The run's name and stage, and what can be done to it.
 *
 * @param {{
 *   run: Object, loading: boolean, busy: boolean, onRefresh: () => void,
 *   actions: ReturnType<import('./useRunActions').useRunActions>,
 * }} props
 */
export default function RunHeader({ run, loading, busy, onRefresh, actions }) {
  const { can } = usePermission();
  const canRun = allow(can, WORKFLOW_PERMISSIONS.RUN);
  /*
   * Gates BOTH Pause and Stop — `WorkflowInstances.Cancel` guards the two
   * endpoints, so they are not separately grantable. Worth knowing before
   * treating Pause as the softer permission to hand out more widely: giving
   * somebody the ability to hold a run also gives them the ability to end one.
   *
   * Separate from `Workflows.Run` either way: nudging a workflow along is not
   * the same as stopping it.
   */
  const canStopRuns = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.CANCEL);
  const action = runAction(run);
  const running = run.statusKey === INSTANCE_STATUS.RUNNING;
  // A faulted run can be stopped too (2026-10-21): it still holds its records
  // and its open to-dos, and stopping it is how it lets them go.
  const stoppable = running || run.statusKey === INSTANCE_STATUS.FAULTED;

  return (
    <PageHeader
      title={`${run.definitionCode ?? 'Run'} · v${run.definitionVersion ?? '?'}`}
      subtitle={run.currentStageTitle ? `Standing in ${run.currentStageTitle}` : undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Admin' },
        { label: 'Monitoring', href: ROUTES.MONITORING_RUNS },
        { label: run.definitionCode ?? 'Run' },
      ]}
      actions={
        <>
          <Link href={ROUTES.MONITORING_RUNS}>
            <Button variant="ghost" size="sm" icon={ChevronLeft}>Back</Button>
          </Link>
          {/* `loading` here is a refresh of a run already on screen — the
              first load is the page's spinner, not this. */}
          <Button variant="outline" size="sm" icon={RefreshCw} loading={loading} onClick={onRefresh}>
            Refresh
          </Button>

          {/* One button, chosen by status. They are not interchangeable:
              advancing a faulted run answers 200 and does nothing. */}
          {canRun && action === 'advance' && (
            <Button size="sm" icon={ArrowRight} loading={busy} onClick={actions.handleAdvance}>Advance</Button>
          )}
          {canRun && action === 'resume' && (
            <Button size="sm" icon={RotateCcw} onClick={actions.askToResume}>Resume</Button>
          )}

          {/*
            Pause on a running run only; Stop on a running or a faulted one —
            the endpoints refuse anything else with WF-001, and offering them on
            a finished run would be a button that can only fail. Deliberately
            last and outlined rather than solid: Stop is the one irreversible
            action here, and it should not sit where somebody reaches for Advance.

            Pause before Stop: the reversible one is reached first, so
            somebody who only needs to hold a run does not have to walk past Stop.
          */}
          {canStopRuns && running && (
            <Button
              size="sm"
              variant="outline"
              icon={PauseCircle}
              onClick={() => actions.askToStop('pause')}
              title="Hold this run — Resume picks it up where it stopped"
            >
              Pause
            </Button>
          )}
          {canStopRuns && stoppable && (
            <Button
              size="sm"
              variant="outline"
              icon={CircleSlash}
              onClick={() => actions.askToStop('cancel')}
              title="Terminate this run Entirely — it cannot be resumed, and starting again means starting from the beginning"
            >
              Stop
            </Button>
          )}
        </>
      }
    />
  );
}
