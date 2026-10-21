'use client';

import { useEffect, useRef } from 'react';

import { stageProblems } from '@/lib/workflowProblems';
import StepInspector from './StepInspector';
import StageInspector from './StageInspector';
import WorkflowInspector from './WorkflowInspector';

/**
 * The side panel beside the canvas (2026-10-08): whatever is open — a step or
 * a stage — or, with nothing open, the workflow's own settings.
 *
 * It scrolls on its own, next to the canvas, so it is in view whichever card
 * was clicked. Below the large breakpoint it sits under the canvas instead,
 * and opening something scrolls down to it.
 *
 * @param {{
 *   inspector: ReturnType<import('./useInspector').useInspector>,
 *   ctx: Object, state: Object, dispatch: Function,
 *   editing: ReturnType<import('../page/useBuilderEditing').useBuilderEditing>,
 *   workflow: { events, targetTypes, catalogsLoaded, notificationTypes, resolvedById, fields },
 *   className?: string,
 * }} props
 */
export default function Inspector({ inspector, ctx, state, dispatch, editing, workflow, className = '' }) {
  const ref = useRef(null);
  const { resolved, reveal } = inspector;

  // On every open: back to the top of the panel, into view on a small screen,
  // and focus when it was opened from the keyboard.
  useEffect(() => {
    const el = ref.current;
    if (!el || reveal.seq === 0) return;
    el.scrollTop = 0;
    if (window.matchMedia('(max-width: 1023px)').matches) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (reveal.focus) el.focus({ preventScroll: true });
  }, [reveal]);

  return (
    <aside
      ref={ref}
      tabIndex={-1}
      aria-label="Properties"
      // Esc in the panel closes it — unless it was meant for a field.
      onKeyDown={(e) => {
        const typing = e.target.closest?.('input, textarea, select, [contenteditable="true"]');
        if (e.key === 'Escape' && resolved && !typing) inspector.close();
      }}
      className={`rounded-2xl border border-[#e6e4dd] bg-white outline-none ${className}`}
    >
      {/* Keyed per opening, not per id: a rename changes the id, and remounting
          then would swallow the click that ended the rename. */}
      {resolved?.kind === 'step' ? (
        <StepInspector
          key={`step-${reveal.seq}`}
          resolved={resolved}
          ctx={ctx}
          tab={inspector.tab}
          onTab={inspector.setTab}
          onClose={inspector.close}
        />
      ) : resolved?.kind === 'stage' ? (
        <StageInspector
          key={`stage-${reveal.seq}`}
          resolved={resolved}
          stages={state.graph.stages}
          startStageId={state.graph.startStageId}
          fields={workflow.fields}
          editing={editing}
          problems={stageProblems(ctx.serverProblems, resolved.id)}
          onClose={inspector.close}
        />
      ) : (
        <WorkflowInspector
          tab={inspector.workflowTab}
          onTab={inspector.setWorkflowTab}
          state={state}
          dispatch={dispatch}
          {...workflow}
        />
      )}
    </aside>
  );
}
