'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, ChevronRight, History, Info, Play, RotateCcw, Workflow } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StartRunModal from '@/components/workflow/startRun/StartRunModal';
import { workflowRepository } from '@/repositories/workflowRepository';
import { groupRunsByWorkflow, isLiveRun } from '@/lib/runDetail';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { INSTANCE_STATUS, INSTANCE_STATUS_COLORS, INSTANCE_STATUS_LABELS, canStartByHand } from '@/constants/workflow';
import { ROUTES } from '@/constants/routes';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { fetchDefinitions, selectDefinitions } from '@/store/slices/workflowSlice';

const PAGE_SIZE = 50;

/**
 * @param {{ open: boolean, onClose: () => void, targetTypeKey: number, targetId: string|number, recordLabel?: string, }} props
 */
export default function TargetRunsModal({ open, onClose, targetTypeKey, targetId, recordLabel = 'this record' }) {
  const dispatch = useDispatch();
  const { can } = usePermission();

  const [state, setState] = useState({ runs: [], total: 0, loading: false, error: null, loaded: false });
  const [loadingMore, setLoadingMore] = useState(false);

  const canRun = allow(can, WORKFLOW_PERMISSIONS.RUN);
  const [startFor, setStartFor] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const closeStart = () => {
    setStartFor(null);
    setReloadKey((k) => k + 1);
  };

  const canViewDefinitions = allow(can, WORKFLOW_PERMISSIONS.VIEW);
  const definitions = useSelector(selectDefinitions);
  useEffect(() => {
    if (open && canViewDefinitions && definitions.length === 0) dispatch(fetchDefinitions());
  }, [open, canViewDefinitions, definitions.length, dispatch]);

  const nameByCode = useMemo(() => {
    const map = {};
    for (const d of definitions) if (d.code) map[d.code] = d.name;
    return map;
  }, [definitions]);

  const definitionByCode = useMemo(() => {
    const map = {};
    for (const d of definitions) if (d.code) map[d.code] = d;
    return map;
  }, [definitions]);

  useEffect(() => {
    if (!open || targetId == null) return undefined;

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    workflowRepository.getInstances({ targetTypeKey, targetId, skip: 0, take: PAGE_SIZE })
      .then(({ items, total }) => {
        if (!cancelled) setState({ runs: items, total, loading: false, error: null, loaded: true });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ runs: [], total: 0, loading: false, error: err.message || 'Could not load the runs.', loaded: true });
        }
      });

    return () => { cancelled = true; };
  }, [open, targetTypeKey, targetId, reloadKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { items, total } = await workflowRepository.getInstances({
        targetTypeKey, targetId, skip: state.runs.length, take: PAGE_SIZE,
      });
      setState((s) => {
        const seen = new Set(s.runs.map((r) => r.instanceId));
        return { ...s, runs: [...s.runs, ...items.filter((r) => !seen.has(r.instanceId))], total };
      });
    } catch (err) {
      setState((s) => ({ ...s, error: err.message || 'Could not load older runs.' }));
    } finally {
      setLoadingMore(false);
    }
  };

  const groups = useMemo(() => groupRunsByWorkflow(state.runs), [state.runs]);
  const more = state.total - state.runs.length;

  const neverRun = useMemo(() => {
    if (!canRun || !state.loaded) return [];
    const seen = new Set(groups.map((g) => g.code));
    return definitions
      .filter((d) => d.isPublished && canStartByHand(d.triggerTypeKey) && d.targetTypeKey === targetTypeKey && !seen.has(d.code))
      .sort((a, b) => String(a.name ?? a.code).localeCompare(String(b.name ?? b.code)));
  }, [canRun, state.loaded, groups, definitions, targetTypeKey]);

  const startWorkflow = (code) => setStartFor({ code, name: nameByCode[code] ?? code });

  return (
    <>
    <Modal open={open && !startFor} onClose={onClose} title="Workflow runs" size="lg">
      <p className="mb-4 text-xs" style={{ color: CHROME.textMuted }}>
        Every workflow that has run on {recordLabel}, the one still going (or the latest) first in each.
        Choose a run to open it.
      </p>

      {!state.loaded || state.loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : state.error && state.runs.length === 0 ? (
        <p className="inline-flex items-center gap-1.5 py-6 text-sm" style={{ color: STATUS.critical }}>
          <AlertTriangle size={14} aria-hidden="true" />
          {state.error}
        </p>
      ) : groups.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: CHROME.textMuted }}>
          No workflow has run on {recordLabel} yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <section key={group.code ?? 'unknown'} className="rounded-xl border border-[#eceae4]">
              <header className="flex items-center gap-2 border-b border-[#f1f0ee] px-3 py-2">
                <Workflow size={13} style={{ color: CHROME.textMuted }} aria-hidden="true" />
                <span className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
                  {nameByCode[group.code] ?? group.code ?? 'Unknown workflow'}
                </span>
                {nameByCode[group.code] && (
                  <span className="font-mono text-[11px]" style={{ color: CHROME.textMuted }}>{group.code}</span>
                )}
                <span className="ml-auto text-[11px]" style={{ color: CHROME.textMuted }}>
                  {group.earlier.length + 1} run{group.earlier.length === 0 ? '' : 's'}
                </span>
              </header>

              <div className="p-2">
                <RunRow run={group.headline} tag={group.isCurrent ? 'Current' : 'Latest'} onOpen={onClose} prominent />

                {group.earlier.length > 0 && (
                  <>
                    <p
                      className="mt-2 mb-1 inline-flex items-center gap-1 px-2 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: CHROME.textMuted }}
                    >
                      <History size={10} aria-hidden="true" />
                      Earlier runs
                    </p>
                    {group.earlier.map((run) => (
                      <RunRow key={run.instanceId} run={run} onOpen={onClose} />
                    ))}
                  </>
                )}

                {canRun && group.code && (
                  <RunAgain
                    group={group}
                    definition={definitionByCode[group.code]}
                    recordLabel={recordLabel}
                    onStart={() => startWorkflow(group.code)}
                  />
                )}
              </div>
            </section>
          ))}

          {neverRun.length > 0 && (
            <section className="rounded-xl border border-dashed border-[#e1e0d9] p-3">
              <p className="mb-2 text-xs font-semibold" style={{ color: CHROME.textSecondary }}>
                Start another workflow on {recordLabel}
              </p>
              <div className="flex flex-col gap-1">
                {neverRun.map((d) => (
                  <div key={d.code} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f6f5f3]">
                    <Workflow size={12} style={{ color: CHROME.textMuted }} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-xs" style={{ color: CHROME.textPrimary }}>
                      {d.name ?? d.code}
                      <span className="ml-1.5 font-mono text-[11px]" style={{ color: CHROME.textMuted }}>{d.code}</span>
                    </span>
                    <Button variant="outline" size="xs" icon={Play} onClick={() => startWorkflow(d.code)}>
                      Start
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {more > 0 && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={loadMore} loading={loadingMore}>
                Show {Math.min(more, PAGE_SIZE)} older run{Math.min(more, PAGE_SIZE) === 1 ? '' : 's'}
              </Button>
            </div>
          )}
          {state.error && state.runs.length > 0 && (
            <p className="text-center text-xs" style={{ color: STATUS.critical }}>{state.error}</p>
          )}
        </div>
      )}
    </Modal>

    {startFor && (
      <StartRunModal
        key={startFor.code}
        workflow={startFor}
        open
        onClose={closeStart}
        onOpenRun={() => { setStartFor(null); onClose(); }}
        presetTargetIds={[String(targetId)]}
        presetTargetTypeKey={targetTypeKey}
        presetTargetLabel={recordLabel}
      />
    )}
    </>
  );
}

function RunAgain({ group, definition, recordLabel, onStart }) {
  if (group.isCurrent) {
    const faulted = group.headline.statusKey === INSTANCE_STATUS.FAULTED;
    return (
      <p className="mt-2 flex items-start gap-1.5 px-2 text-[11px] leading-snug" style={{ color: CHROME.textMuted }}>
        <Info size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
        {faulted
          ? 'This workflow stopped with an error and still holds this record. Open the run and resume it — or stop it there, then start it again.'
          : 'This workflow is still going on this record, so it cannot be started again yet. Open the run to stop it, or let it finish.'}
      </p>
    );
  }

  const unpublished = definition != null && !definition.isPublished;
  const scheduled = definition != null && !canStartByHand(definition.triggerTypeKey);

  return (
    <div className="mt-2 flex items-center justify-end gap-2 px-2">
      {unpublished ? (
        <span className="text-[11px]" style={{ color: CHROME.textMuted }}>
          No version of this workflow is published, so it cannot run.
        </span>
      ) : scheduled && (
        <span className="text-[11px]" style={{ color: CHROME.textMuted }}>
          This workflow runs on a schedule, and its own search picks the records — it cannot be started by hand.
        </span>
      )}
      <Button
        variant="outline"
        size="xs"
        icon={RotateCcw}
        onClick={onStart}
        disabled={unpublished || scheduled}
        title={`Start a new run of this workflow on ${recordLabel}`}
      >
        Run again
      </Button>
    </div>
  );
}

function RunRow({ run, tag = null, prominent = false, onOpen }) {
  const color = INSTANCE_STATUS_COLORS[run.statusKey] ?? CHROME.textMuted;
  const live = isLiveRun(run);

  return (
    <Link
      href={ROUTES.MONITORING_RUN(run.instanceId)}
      onClick={onOpen}
      className={`group flex items-center gap-3 rounded-lg px-2 transition-colors hover:bg-[#f6f5f3] ${prominent ? 'py-2.5' : 'py-1.5'}`}
    >
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: withAlpha(color, 0.12), color }}
      >
        {INSTANCE_STATUS_LABELS[run.statusKey] ?? run.status ?? '—'}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block truncate ${prominent ? 'text-sm font-medium' : 'text-xs'}`} style={{ color: CHROME.textPrimary }}>
          {live ? (run.currentStageTitle ?? run.currentStageId ?? 'Starting') : `Started ${formatDateTime(run.startedOn) || '—'}`}
          {run.definitionVersion != null && (
            <span className="ml-1.5 text-[11px] font-normal" style={{ color: CHROME.textMuted }}>v{run.definitionVersion}</span>
          )}
        </span>
        <span className="block truncate text-[11px]" style={{ color: CHROME.textMuted }}>
          {live
            ? `Started ${formatDateTime(run.startedOn) || '—'}`
            : `Ended ${formatDateTime(run.completedOn) || '—'}`}
          {run.failureReason && ` · ${run.failureReason}`}
        </span>
      </span>

      {tag && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={
            tag === 'Current'
              ? { backgroundColor: withAlpha(STATUS.info, 0.12), color: STATUS.info }
              : { backgroundColor: '#f1f0ee', color: CHROME.textSecondary }
          }
        >
          {tag}
        </span>
      )}
      <ChevronRight size={14} className="shrink-0 opacity-40 group-hover:opacity-100" style={{ color: CHROME.textMuted }} aria-hidden="true" />
    </Link>
  );
}
