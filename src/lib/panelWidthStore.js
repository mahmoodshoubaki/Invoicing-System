const KEY = 'wf-builder-panel-width';

export const DEFAULT_PANEL_WIDTH = 420;
export const MIN_PANEL_WIDTH = 360;
export const MAX_PANEL_SHARE = 0.6;

export function clampPanelWidth(width, workspaceWidth) {
  const max = Math.max(MIN_PANEL_WIDTH, Math.floor((workspaceWidth || 0) * MAX_PANEL_SHARE));
  return Math.round(Math.min(Math.max(width, MIN_PANEL_WIDTH), max));
}

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
 * @param {{ persist?: boolean }} [options]
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
