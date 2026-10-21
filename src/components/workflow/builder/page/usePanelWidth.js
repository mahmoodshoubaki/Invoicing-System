'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import {
  DEFAULT_PANEL_WIDTH, MIN_PANEL_WIDTH, clampPanelWidth, getPanelWidth, getServerPanelWidth, maxPanelWidth,
  setPanelWidth, subscribePanelWidth,
} from '@/lib/panelWidthStore';

/** Half the grid's gap: the handle sits in the middle of it. */
const HALF_GAP = 10;
/** One arrow-key press. */
const STEP = 24;

/**
 * The side panel's width (2026-10-12): what the author dragged it to, held
 * inside what the workspace can take right now — a remembered 700px still
 * fits on a smaller screen, and comes back on a wider one.
 *
 * @param {React.RefObject<HTMLElement>} workspaceRef  the grid holding the canvas and the panel
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

  /** Dragging the handle: live while it moves, remembered when it is let go. */
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

  /** The handle from the keyboard: arrows move the divider, Home / End go to the ends. */
  const onHandleKey = useCallback((e) => {
    const total = workspaceRef.current?.getBoundingClientRect().width ?? 0;
    // The width as it is now, not as of the last render — a held arrow key
    // repeats faster than the screen redraws.
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

  /**
   * Wide for a big condition, and back to where it was. Measured at the click
   * rather than read off the observer, which a browser stops running for a tab
   * it is not drawing.
   */
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
