'use client';

import { memo } from 'react';
import { CalendarClock, CircleDot, Zap } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { TARGET_TYPE_LABELS, TRIGGER_KIND } from '@/constants/workflow';
import { describeCron } from '@/utils/cron';
import { connectorLine, iconChip, nodeCard } from './canvasStyles';
import MenuButton from './menu/MenuButton';
import { menuOnRightClick, openOnHeaderClick } from './menu/cardEvents';

const KINDS = {
  [TRIGGER_KIND.MANUAL]: { icon: CircleDot, label: 'Started by a person' },
  [TRIGGER_KIND.EVENT]: { icon: Zap, label: 'Starts on an event' },
  [TRIGGER_KIND.SCHEDULE]: { icon: CalendarClock, label: 'Runs on a schedule' },
};

/**
 * The head of the flow: what starts a run.
 *
 * Edited in the workflow's settings — clicking it opens them in the side
 * panel, and its menu reaches the workflow's notifications and variables too —
 * but it belongs on the canvas because a flow that begins at its first stage
 * never says *why* a run exists. Every workflow tool puts the trigger at the
 * top for the same reason.
 *
 * @param {{ trigger: Object, targetTypeKey: number, onOpen: (o: {focus: boolean}) => void, onMenu: (from) => void }} props
 */
function TriggerNode({ trigger, targetTypeKey, onOpen, onMenu }) {
  const kind = KINDS[trigger?.kind] ?? KINDS[TRIGGER_KIND.MANUAL];
  const Icon = kind.icon;
  const accent = STATUS.good;

  const detail =
    trigger?.kind === TRIGGER_KIND.EVENT
      ? trigger.eventName || 'no event chosen'
      : trigger?.kind === TRIGGER_KIND.SCHEDULE
        ? describeCron(trigger.cron) ?? trigger.cron ?? 'no schedule set'
        : 'on demand';

  return (
    <div className="flex flex-col items-stretch">
      <div
        className="mx-auto w-full max-w-2xl"
        style={{ ...nodeCard, borderStyle: 'dashed' }}
        onContextMenu={menuOnRightClick(onMenu)}
      >
        <div className="flex cursor-pointer items-center gap-2.5 p-3" onClick={openOnHeaderClick(onOpen)}>
          <div style={iconChip(accent, 32)}>
            <Icon size={15} aria-hidden="true" />
          </div>

          <button
            type="button"
            data-open
            className="min-w-0 flex-1 text-left focus:outline-none focus-visible:underline"
            title="Open the workflow's settings"
          >
            <span className="block text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
              {kind.label}
            </span>
            <span className="block truncate text-[11px]" style={{ color: CHROME.textMuted }}>
              {detail}
              {' · tracks '}
              {TARGET_TYPE_LABELS[targetTypeKey]?.toLowerCase() ?? 'nothing'}
            </span>
          </button>

          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: withAlpha(accent, 0.12), color: accent }}
          >
            Trigger
          </span>

          <MenuButton label="Workflow — actions" onOpen={onMenu} />
        </div>
      </div>

      <div className="flex flex-col items-center py-1.5">
        <div style={{ ...connectorLine, height: 22 }} />
      </div>
    </div>
  );
}

export default memo(TriggerNode);
