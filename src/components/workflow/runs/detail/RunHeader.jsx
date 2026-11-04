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
 * @param {{ run: Object, loading: boolean, busy: boolean, onRefresh: () => void, actions: ReturnType<import('./useRunActions').useRunActions>, }} props
 */
export default function RunHeader({ run, loading, busy, onRefresh, actions }) {
  const { can } = usePermission();
  const canRun = allow(can, WORKFLOW_PERMISSIONS.RUN);
  const canStopRuns = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.CANCEL);
  const action = runAction(run);
  const running = run.statusKey === INSTANCE_STATUS.RUNNING;
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
          <Button variant="outline" size="sm" icon={RefreshCw} loading={loading} onClick={onRefresh}>
            Refresh
          </Button>

          {canRun && action === 'advance' && (
            <Button size="sm" icon={ArrowRight} loading={busy} onClick={actions.handleAdvance}>Advance</Button>
          )}
          {canRun && action === 'resume' && (
            <Button size="sm" icon={RotateCcw} onClick={actions.askToResume}>Resume</Button>
          )}

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
