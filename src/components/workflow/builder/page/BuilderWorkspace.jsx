'use client';

import { useRef } from 'react';

import { PanelSizeContext } from '@/components/workflow/builder/inspector/PanelSizeContext';
import PanelResizeHandle from './PanelResizeHandle';
import { usePanelWidth } from './usePanelWidth';

/**
 * The canvas and the side panel as one workspace the window's height, each
 * scrolling on its own — so the panel is beside whichever card was clicked.
 * The panel's width is the author's (2026-10-12): dragged at the divider, or
 * sent wide by the panel's Expand button, and remembered in this browser.
 *
 * @param {{ canvas: React.ReactNode, panel: React.ReactNode }} props
 */
export default function BuilderWorkspace({ canvas, panel }) {
  const ref = useRef(null);
  const size = usePanelWidth(ref);

  return (
    <PanelSizeContext.Provider value={size.controls}>
      <div
        ref={ref}
        className="relative grid grid-cols-1 gap-5 lg:h-[calc(100vh-6rem)] lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_var(--panel-w)] lg:grid-rows-[minmax(0,1fr)]"
        style={{ '--panel-w': `${size.width}px` }}
      >
        {canvas}
        <PanelResizeHandle
          width={size.width}
          widest={size.widest}
          onPointerDown={size.startDrag}
          onKeyDown={size.onHandleKey}
          onReset={size.reset}
        />
        {panel}
      </div>
    </PanelSizeContext.Provider>
  );
}
