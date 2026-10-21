/**
 * The builder's side-panel width (2026-10-12): dragged, remembered in this
 * browser, and the same in every tab of it.
 *
 * Read through useSyncExternalStore, which is what keeps it hydration-safe:
 * the server renders the default, and the remembered width arrives in the
 * first client render after it. Browser storage can be missing or refuse
 * (a private window, blocked site data), so every read and write is guarded
 * and the width then simply lives for this page only.
 */

const KEY = 'wf-builder-panel-width';

export const DEFAULT_PANEL_WIDTH = 420;
export const MIN_PANEL_WIDTH = 360;
/** Never more than this share of the workspace — the canvas has to stay usable. */
export const MAX_PANEL_SHARE = 0.6;

/** A width the workspace can hold: at least the minimum, at most the share. */
export function clampPanelWidth(width, workspaceWidth) {
  const max = Math.max(MIN_PANEL_WIDTH, Math.floor((workspaceWidth || 0) * MAX_PANEL_SHARE));
  return Math.round(Math.min(Math.max(width, MIN_PANEL_WIDTH), max));
}

/** The widest the panel may be in a workspace this wide. */
export function maxPanelWidth(workspaceWidth) {
  return clampPanelWidth(Number.MAX_SAFE_INTEGER, workspaceWidth);
}

let current = null;
const listeners = new Set();

function readStored() {
  try {
    const n = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(n) && n >= MIN_PANEL_WIDTH ? n : DEFAULT_PANEL_WIDTH;
  } catch {
    return DEFAULT_PANEL_WIDTH;
  }
}

export function getPanelWidth() {
  if (current == null) current = readStored();
  return current;
}

export function getServerPanelWidth() {
  return DEFAULT_PANEL_WIDTH;
}

/**
 * @param {number} width
 * @param {{ persist?: boolean }} [options]  false while a drag is under way; true when it ends
 */
export function setPanelWidth(width, { persist = true } = {}) {
  current = width;
  if (persist) {
    try {
      window.localStorage.setItem(KEY, String(width));
    } catch {
      // Not remembered — it still holds for this page.
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribePanelWidth(listener) {
  listeners.add(listener);
  // Another tab of this browser changed it.
  const onStorage = (e) => {
    if (e.key !== KEY) return;
    current = null;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}
