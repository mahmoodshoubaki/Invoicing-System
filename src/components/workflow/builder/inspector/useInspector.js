'use client';

import { useCallback, useMemo, useState } from 'react';

import { resolveTarget, samePlace } from './resolveTarget';

/**
 * @param {{ graph: Object, workflowKey: string|null }} options
 */
export function useInspector({ graph, workflowKey }) {
  const [target, setTarget] = useState(null);
  const [workflowTab, setWorkflowTab] = useState('settings');
  const [reveal, setReveal] = useState({ seq: 0, focus: false });

  const current = target && target.key === workflowKey ? target : null;
  const resolved = useMemo(() => resolveTarget(graph, current), [graph, current]);

  if (current && (!resolved || resolved.id !== current.id || !samePlace(resolved.at, current.at))) {
    setTarget(resolved ? { ...current, id: resolved.id, at: resolved.at } : null);
  }

  const show = useCallback((focus) => setReveal((r) => ({ seq: r.seq + 1, focus })), []);

  const open = useCallback((kind, id, tab = null, { focus = false } = {}) => {
    setTarget({ key: workflowKey, kind, id, tab, at: null });
    show(focus);
  }, [show, workflowKey]);

  const openAt = useCallback((kind, at) => {
    setTarget({ key: workflowKey, kind, id: null, tab: null, at });
    show(false);
  }, [show, workflowKey]);

  const setTab = useCallback((tab) => setTarget((t) => (t ? { ...t, tab } : t)), []);

  const close = useCallback(() => setTarget(null), []);

  const showWorkflow = useCallback((tab = null, { focus = false } = {}) => {
    setTarget(null);
    if (tab) setWorkflowTab(tab);
    show(focus);
  }, [show]);

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
