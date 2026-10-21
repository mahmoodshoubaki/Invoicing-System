import Link from 'next/link';
import { Cog, Fingerprint, GitBranch, UserCheck } from 'lucide-react';

import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';
import { INSTANCE_STATUS, INSTANCE_STATUS_COLORS } from '@/constants/workflow';

/** One recorded move: from where to where, when, by whom — and the trace of what else it did. */
function HistoryRow({ row, last }) {
  const rowColor = INSTANCE_STATUS_COLORS[row.toStatusKey] ?? CHROME.textMuted;

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: rowColor }} aria-hidden="true" />
        {!last && <span className="w-px flex-1" style={{ backgroundColor: '#e6e4dd' }} />}
      </div>

      <div className={`min-w-0 flex-1 ${last ? '' : 'pb-3'}`}>
        <p className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: CHROME.textPrimary }}>
          {row.fromStageTitle ? (
            <>
              <span style={{ color: CHROME.textMuted }}>{row.fromStageTitle}</span>
              <GitBranch size={11} style={{ color: CHROME.textMuted }} aria-hidden="true" />
            </>
          ) : (
            <span style={{ color: CHROME.textMuted }}>started</span>
          )}
          <strong>{row.toStageTitle ?? row.toStageId ?? '—'}</strong>
        </p>

        {/*
          Who moved it, and when.

          A row with no `performedByName` is not missing data — it is the
          engine's own work: a deadline firing, a delay waking up, a retry
          coming back. Saying so is the useful distinction on a timeline,
          because "nobody touched this, it happened on its own" is exactly
          what somebody reading a run is trying to establish.
        */}
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
          <span>{row.performedOn ? formatDateTime(row.performedOn) : 'no time recorded'}</span>
          <span aria-hidden="true">·</span>
          {row.performedByName ? (
            <span className="inline-flex items-center gap-1">
              <UserCheck size={10} aria-hidden="true" />
              {row.performedByName}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 italic">
              <Cog size={10} aria-hidden="true" />
              by the engine
            </span>
          )}
          {/* Everything the same action caused — the tasks it made, the
              notifications that went out. Only on rows that carry a tracking
              number (none before 2026-10-07). The page itself needs
              WorkflowInstances.View, which is all the trace asks for. */}
          {row.correlationId && (
            <>
              <span aria-hidden="true">·</span>
              <Link
                href={ROUTES.MONITORING_TRACE(row.correlationId)}
                className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                style={{ color: STATUS.info }}
                title={`Tracking number ${row.correlationId}`}
              >
                <Fingerprint size={10} aria-hidden="true" />
                What else this did
              </Link>
            </>
          )}
        </p>

        {/* Notes carry the cancellation reason and the note left on a resume,
            so they are never decoration. */}
        {row.notes && (
          <p className="mt-1 rounded-md px-2 py-1 text-[11px] leading-snug" style={{ backgroundColor: '#fbfaf9', color: CHROME.textSecondary }}>
            {row.notes}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Where the run is NOW, as the last entry.
 *
 * The history records stage transitions, so on a live run it stops at "arrived
 * in QS review" and says nothing about the to-do that arrival created — which
 * reads as a timeline that just stops. This closes the gap between the two
 * panels: the last thing that happened, and the thing being waited for.
 *
 * It is the present, not a record, so it is drawn hollow.
 */
function NowRow({ run, openTasks }) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className="mt-1 size-2 shrink-0 rounded-full border-2"
          style={{ borderColor: STATUS.info, backgroundColor: 'transparent' }}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium" style={{ color: STATUS.info }}>Now</p>
        <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: CHROME.textMuted }}>
          {openTasks.length > 0 ? (
            <>
              Waiting for somebody to answer{' '}
              {openTasks.map((t) => t.title).join(', ')}
              {run.currentStageTitle && <> in <strong>{run.currentStageTitle}</strong></>}.
            </>
          ) : run.delayUntil ? (
            <>Asleep until {formatDateTime(run.delayUntil)}.</>
          ) : (
            <>
              Running
              {run.currentStageTitle && <> in <strong>{run.currentStageTitle}</strong></>}
              {run.currentStepId && <> at <span className="font-mono">{run.currentStepId}</span></>}
              , not waiting on a person.
            </>
          )}
        </p>
      </div>
    </li>
  );
}

/**
 * The audit trail — its own call since 2026-09-13, because a long-running
 * workflow's history has no ceiling and shipping all of it on every poll of the
 * run's state was the cost of a timeline.
 *
 * @param {{ run: Object, history: Array, loaded: boolean, openTasks: Array }} props
 */
export default function RunHistoryPanel({ run, history, loaded, openTasks }) {
  const live = run.statusKey === INSTANCE_STATUS.RUNNING;

  return (
    <Card className="lg:col-span-2">
      <h2 className="mb-3 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
        Workflow History
      </h2>

      {!loaded ? (
        <div className="flex justify-center py-6"><LoadingSpinner /></div>
      ) : history.length === 0 ? (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          Nothing recorded yet.
        </p>
      ) : (
        <ol className="flex flex-col">
          {history.map((row, index) => (
            // The "Now" entry is part of the timeline, so the last recorded row
            // still needs its connector when one follows.
            <HistoryRow key={`${row.performedOn}-${index}`} row={row} last={index === history.length - 1 && !live} />
          ))}
          {live && <NowRow run={run} openTasks={openTasks} />}
        </ol>
      )}
    </Card>
  );
}
