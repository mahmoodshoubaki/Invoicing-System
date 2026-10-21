'use client';

import { memo } from 'react';
import { ArrowDown, CircleSlash, CornerDownRight } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { connectorLine } from './canvasStyles';

/**
 * The edge between one stage node and whatever comes next.
 *
 * A workflow tool's connectors normally carry no information — they are drawn
 * because two boxes are related. These carry the thing that actually decides
 * the run's path: the condition, and where it goes. So each outgoing transition
 * is drawn as its own labelled edge, numbered in the order the engine checks
 * them, because "first match wins" is invisible otherwise.
 *
 * `toStageId: null` is not a missing target — it ends the run — so it gets its
 * own terminal marker rather than an empty edge.
 *
 * Since the stage cards went compact (2026-10-08) this is the canvas's only
 * picture of where a stage goes, so every stage has one — the last too — and
 * clicking it opens that stage's rules in the side panel.
 */
function FlowConnector({ edges = [], onEdgeClick }) {
  if (edges.length === 0) {
    return (
      <div className="flex flex-col items-center py-1.5">
        <div style={{ ...connectorLine, height: 14 }} />
        <button
          type="button"
          onClick={() => onEdgeClick?.(-1)}
          title="Nowhere to go next, so a run ends here. Click to send it somewhere."
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-white"
          style={{ backgroundColor: withAlpha(CHROME.textMuted, 0.1), color: CHROME.textMuted }}
        >
          <CircleSlash size={9} aria-hidden="true" />
          stops here
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-1">
      <div style={{ ...connectorLine, height: 12 }} />

      <div className="flex w-full max-w-xl flex-col items-stretch gap-1 py-1">
        {edges.map((edge, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onEdgeClick?.(i)}
            title="Click to change where this stage goes"
            className="group flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-white"
          >
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold tabular-nums"
              style={{ backgroundColor: '#e6e4dd', color: CHROME.textSecondary }}
              title={i === 0 ? 'Checked first' : `Checked ${i + 1}${i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`}
            >
              {i + 1}
            </span>

            <CornerDownRight size={11} style={{ color: CHROME.textMuted }} aria-hidden="true" className="shrink-0" />

            <span
              className="min-w-0 flex-1 truncate text-left text-[11px]"
              style={{ color: edge.isCatchAll ? CHROME.textMuted : CHROME.textPrimary }}
              title={edge.label}
            >
              {edge.label}
            </span>

            <ArrowDown size={11} style={{ color: CHROME.textMuted }} aria-hidden="true" className="shrink-0" />

            <span
              className="shrink-0 truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style={
                edge.target
                  ? { backgroundColor: '#ffffff', color: CHROME.textPrimary, border: '1px solid #e6e4dd' }
                  : { backgroundColor: withAlpha(STATUS.neutral, 0.14), color: CHROME.textSecondary }
              }
            >
              {edge.target ?? 'End the run'}
            </span>
          </button>
        ))}
      </div>

      <div style={{ ...connectorLine, height: 12 }} />
    </div>
  );
}

export default memo(FlowConnector);
