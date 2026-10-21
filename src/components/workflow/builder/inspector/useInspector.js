'use client';

import { useCallback, useMemo, useState } from 'react';

import { resolveTarget, samePlace } from './resolveTarget';

/**
 * What the side panel shows: a stage, a step, or — with nothing open — the
 * workflow's own settings, at one of their tabs.
 *
 * Like the clipboard, an open item belongs to ONE workflow (`workflowKey`):
 * the page stays mounted when another workflow is opened, and the panel must
 * not show a stage of the previous one. It is not part of the document either,
 * so undo never closes or opens it.
 *
 * @param {{ graph: Object, workflowKey: string|null }} options
 */
export function useInspector({ graph, workflowKey }) {
  const [target, setTarget] = useState(null);
  const [workflowTab, setWorkflowTab] = useState('settings');
  // Bumped on every open, so the panel can scroll itself into view (and take
  // focus, when it was opened from the keyboard) — even reopening the same item.
  const [reveal, setReveal] = useState({ seq: 0, focus: false });

  const current = target && target.key === workflowKey ? target : null;
  const resolved = useMemo(() => resolveTarget(graph, current), [graph, current]);

  // Follow the item: a rename, an undo or a move keeps the panel on it, a
  // delete closes it (see resolveTarget). Adjusting state while rendering is
  // React's own pattern for state that tracks props; it settles in one pass.
  if (current && (!resolved || resolved.id !== current.id || !samePlace(resolved.at, current.at))) {
    setTarget(resolved ? { ...current, id: resolved.id, at: resolved.at } : null);
  }

  const show = useCallback((focus) => setReveal((r) => ({ seq: r.seq + 1, focus })), []);

  /** Opens a stage or a step, at a tab (null for its first). */
  const open = useCallback((kind, id, tab = null, { focus = false } = {}) => {
    setTarget({ key: workflowKey, kind, id, tab, at: null });
    show(focus);
  }, [show, workflowKey]);

  /** Opens something by where it is — what was just added, before it has an id. */
  const openAt = useCallback((kind, at) => {
    setTarget({ key: workflowKey, kind, id: null, tab: null, at });
    show(false);
  }, [show, workflowKey]);

  const setTab = useCallback((tab) => setTarget((t) => (t ? { ...t, tab } : t)), []);

  const close = useCallback(() => setTarget(null), []);

  /** Back to the workflow's own settings, at a tab. */
  const showWorkflow = useCallback((tab = null, { focus = false } = {}) => {
    setTarget(null);
    if (tab) setWorkflowTab(tab);
    show(focus);
  }, [show]);

  /**
   * A brand-new workflow only gets its code when first saved. It is still the
   * same workflow, so what was open stays open rather than closing on save.
   */
  const adoptCode = useCallback((savedCode) => {
    setTarget((t) => (t && t.key === null ? { ...t, key: savedCode } : t));
  }, []);

  const inspecting = useMemo(
    () => (resolved ? { kind: resolved.kind, id: resolved.id } : null),
    [resolved]
  );

  return {
    resolved,
    tab: current?.tab ?? null,
    workflowTab,
    reveal,
    inspecting,
    open,
    openAt,
    setTab,
    setWorkflowTab,
    close,
    showWorkflow,
    adoptCode,
  };
}
