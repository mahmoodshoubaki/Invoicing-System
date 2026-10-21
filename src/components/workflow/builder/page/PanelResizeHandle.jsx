'use client';

import { CHROME } from '@/theme/vizPalette';
import { MIN_PANEL_WIDTH } from '@/lib/panelWidthStore';

/**
 * The divider between the canvas and the side panel (2026-10-12), in the gap
 * between them. Drag it; or tab to it and use the arrow keys (Home and End go
 * to the narrowest and widest); double-click or Enter puts it back. Large
 * screens only — below them the panel sits under the canvas, full width.
 *
 * @param {{
 *   width: number, widest: number|null, onPointerDown: Function, onKeyDown: Function, onReset: Function,
 * }} props
 */
export default function PanelResizeHandle({ width, widest, onPointerDown, onKeyDown, onReset }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the properties panel"
      aria-valuenow={width}
      aria-valuemin={MIN_PANEL_WIDTH}
      aria-valuemax={widest ?? width}
      tabIndex={0}
      title="Drag to resize. Double-click to reset."
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={onReset}
      className="group/handle absolute bottom-0 top-0 z-20 hidden w-3 cursor-col-resize touch-none outline-none lg:flex lg:justify-center"
      // In the middle of the 20px gap to the panel's left.
      style={{ right: 'calc(var(--panel-w) + 4px)' }}
    >
      <span
        className="my-6 w-0.5 rounded-full opacity-0 transition-opacity group-hover/handle:opacity-100 group-focus-visible/handle:opacity-100 group-active/handle:opacity-100"
        style={{ backgroundColor: CHROME.textMuted }}
        aria-hidden="true"
      />
    </div>
  );
}
