'use client';

import { useContext } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

import PillTabs from '@/components/ui/PillTabs';
import { iconChip } from '@/components/workflow/builder/canvasStyles';
import { CHROME } from '@/theme/vizPalette';
import { PanelSizeContext } from './PanelSizeContext';

const headerButton = 'shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1f0ee]';

/**
 * The frame every view of the side panel shares: what is open (a kind and a
 * name), its tabs, a way back to the workflow's own settings, and — on a large
 * screen — Expand, which sends the panel wide for a big condition and back
 * (2026-10-12). The header stays put while the panel scrolls.
 *
 * @param {{
 *   icon: React.ComponentType, accent: string, kicker: string, title: React.ReactNode,
 *   onClose?: () => void, tabs?: Array<{key: string, label: string}>|null, tab?: string,
 *   onTab?: (key: string) => void, children: React.ReactNode,
 * }} props
 */
export default function InspectorShell({ icon: Icon, accent, kicker, title, onClose, tabs, tab, onTab, children }) {
  const size = useContext(PanelSizeContext);
  const ExpandIcon = size?.expanded ? Minimize2 : Maximize2;

  return (
    <>
      <div className="sticky top-0 z-10 rounded-t-2xl border-b border-[#f1f0ee] bg-white px-4 pb-2.5 pt-3">
        <div className="flex items-center gap-2.5">
          <div style={iconChip(accent, 30)}>
            <Icon size={14} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accent }}>{kicker}</p>
            {title}
          </div>
          {size && (
            <button
              type="button"
              onClick={size.toggleExpand}
              aria-pressed={size.expanded}
              aria-label={size.expanded ? 'Make the panel narrow again' : 'Make the panel wide'}
              title={size.expanded ? 'Back to the width it was' : 'Wide, for a big condition'}
              className={`${headerButton} hidden lg:inline-flex`}
              style={{ color: CHROME.textMuted }}
            >
              <ExpandIcon size={15} aria-hidden="true" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close, back to the workflow's settings"
              title="Close — back to the workflow's settings"
              className={headerButton}
              style={{ color: CHROME.textMuted }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        {tabs && tabs.length > 1 && (
          <div className="mt-2.5">
            <PillTabs tabs={tabs} value={tab} onChange={onTab} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </>
  );
}
