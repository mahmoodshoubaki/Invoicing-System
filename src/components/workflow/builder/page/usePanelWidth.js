'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import {
  DEFAULT_PANEL_WIDTH, MIN_PANEL_WIDTH, clampPanelWidth, getPanelWidth, getServerPanelWidth, maxPanelWidth,
  setPanelWidth, subscribePanelWidth,
} from '@/lib/panelWidthStore';

const HALF_GAP = 10;
const STEP = 24;

/**
 * @param {React.RefObject<HTMLElement>} workspaceRef
 */
export function usePanelWidth(workspaceRef) {
  const stored = useSyncExternalStore(subscribePanelWidth, getPanelWidth, getServerPanelWidth);
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  // The width before Expand, to come back to.
  const beforeExpand = useRef(null);

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setWorkspaceWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [workspaceRef]);

  const width = workspaceWidth ? clampPanelWidth(stored, workspaceWidth) : stored;
  const widest = workspaceWidth ? maxPanelWidth(workspaceWidth) : null;
  const expanded = widest != null && width >= widest - 2;

  const widthAt = useCallback((clientX) => {
    const rect = workspaceRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return clampPanelWidth(rect.right - clientX - HALF_GAP, rect.width);
  }, [workspaceRef]);

  const startDrag = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture?.(e.pointerId);
    document.body.classList.add('select-none');

    const move = (ev) => {
      const next = widthAt(ev.clientX);
      if (next != null) setPanelWidth(next, { persist: false });
    };
    const end = (ev) => {
      const next = widthAt(ev.clientX);
      if (next != null) setPanelWidth(next);
      beforeExpand.current = null;
      document.body.classList.remove('select-none');
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }, [widthAt]);

  const reset = useCallback(() => {
    beforeExpand.current = null;
    setPanelWidth(DEFAULT_PANEL_WIDTH);
  }, []);

  const onHandleKey = useCallback((e) => {
    const total = workspaceRef.current?.getBoundingClientRect().width ?? 0;
    const now = clampPanelWidth(getPanelWidth(), total);
    const to = (next) => {
      e.preventDefault();
      setPanelWidth(clampPanelWidth(next, total));
    };
    // The panel is on the right: moving the divider left makes it wider.
    if (e.key === 'ArrowLeft') to(now + STEP);
    else if (e.key === 'ArrowRight') to(now - STEP);
    else if (e.key === 'Home') to(MIN_PANEL_WIDTH);
    else if (e.key === 'End') to(maxPanelWidth(total));
    else if (e.key === 'Enter') { e.preventDefault(); reset(); }
  }, [reset, workspaceRef]);

  const toggleExpand = useCallback(() => {
    const total = workspaceRef.current?.getBoundingClientRect().width ?? 0;
    if (!total) return;
    const max = maxPanelWidth(total);
    if (clampPanelWidth(width, total) >= max - 2) {
      setPanelWidth(beforeExpand.current ?? DEFAULT_PANEL_WIDTH);
      beforeExpand.current = null;
    } else {
      beforeExpand.current = width;
      setPanelWidth(max);
    }
  }, [width, workspaceRef]);

  const controls = useMemo(() => ({ expanded, toggleExpand }), [expanded, toggleExpand]);

  return { width, widest, startDrag, onHandleKey, reset, controls };
}
