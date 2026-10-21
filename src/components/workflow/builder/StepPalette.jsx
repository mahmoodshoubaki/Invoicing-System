'use client';

import { memo, useEffect, useRef, useState } from 'react';
import {
  BellRing, Bot, Clock, GitFork, Layers, Plus, Repeat, Search, UserCheck, Variable,
} from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import {
  AUTOMATED_MODE,
  FORBIDDEN_IN_BRANCH_REASON,
  STEP_TYPE,
  STEP_TYPE_INFO,
  TARGET_TYPE,
  TYPES_FORBIDDEN_IN_BRANCH,
} from '@/constants/workflow';
import { createStep } from '@/models/workflow';
import { defaultTaskNotifications } from '@/lib/workflowNotifications';

/**
 * What the palette offers, and how each one is built.
 *
 * Every entry constructs its step through `createStep`, the only place allowed
 * to build one — it writes `type` as the first property, and System.Text.Json
 * fails a polymorphic payload whose discriminator arrives later with a 500
 * rather than a validation error.
 *
 * `callApi` is deliberately absent and always will be: the executor refuses it,
 * and an HTTP call is an `automated` step with the `http.call` action.
 *
 * No entry names its step. The reducer numbers it — "Step 1", "Step 2" — across
 * the whole workflow; the kind is already on the card under the title.
 */
const PALETTE = [
  {
    type: STEP_TYPE.HUMAN_TASK,
    icon: UserCheck,
    // The four standard notifications written out ticked, the reminder left
    // off — it needs a due date and a period first.
    build: () => createStep.humanTask({ id: '', title: '', outcomes: [], notifications: defaultTaskNotifications() }),
  },
  {
    type: STEP_TYPE.AUTOMATED,
    icon: Bot,
    /*
     * One entry, always `type: "automated"`. WHICH action it calls is chosen in
     * the editor from the catalog — a second action arriving later is another
     * row in that dropdown, not another palette entry, because the step, its
     * save format and its failure modes are identical either way.
     *
     * The mode is the one thing worth defaulting, and inside a parallel branch
     * it has to be defaulted DIFFERENTLY. `queueAndRetry` parks on a retry slot
     * the instance only has one of, so it cannot go in a branch — and now that
     * it is the engine's default, a step dropped into a branch saying nothing
     * would be refused with WF-008. `manualRetry` is the right fallback there:
     * it still stops on the failed step rather than walking past it.
     */
    build: ({ insideParallelBranch } = {}) =>
      createStep.automated({
        id: '',
        title: '',
        mode: insideParallelBranch ? AUTOMATED_MODE.MANUAL_RETRY : AUTOMATED_MODE.QUEUE_AND_RETRY,
      }),
  },
  {
    type: STEP_TYPE.BRANCH,
    icon: GitFork,
    build: () => createStep.branch({ id: '', title: '' }),
  },
  {
    type: STEP_TYPE.FOR_EACH,
    icon: Repeat,
    build: () => createStep.forEach({ id: '', title: '', itemName: 'item' }),
  },
  {
    type: STEP_TYPE.REPEAT,
    icon: Repeat,
    build: () => createStep.repeat({ id: '', title: '', times: 3 }),
  },
  {
    type: STEP_TYPE.QUERY,
    icon: Search,
    build: () => createStep.query({ id: '', title: '', targetTypeKey: TARGET_TYPE.INVOICE, into: '' }),
  },
  {
    type: STEP_TYPE.SEND_NOTIFICATION,
    icon: BellRing,
    build: () => createStep.sendNotification({ id: '', title: '' }),
  },
  {
    type: STEP_TYPE.SET_VARIABLE,
    icon: Variable,
    build: () => createStep.setVariable({ id: '', title: '', name: '', value: '' }),
  },
  {
    type: STEP_TYPE.DELAY,
    icon: Clock,
    build: () => createStep.delay({ id: '', title: '', delayDays: 1, delayMinutes: 0 }),
  },
  {
    type: STEP_TYPE.PARALLEL,
    icon: Layers,
    build: () =>
      createStep.parallel({
        id: '',
        title: '',
        // Two branches from the start: one branch is not parallel work, and the
        // backend refuses fewer than two anyway.
        branches: [
          { id: 'branch-1', title: 'Branch 1', steps: [] },
          { id: 'branch-2', title: 'Branch 2', steps: [] },
        ],
      }),
  },
];

/** Adds a step to a list. */
function StepPalette({ onAdd, insideParallelBranch = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onDocClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      // This Esc closed the menu; the canvas must not also take it as "clear the
      // selection" or "cancel the move".
      e.stopPropagation();
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-[#f1f0ee]"
        style={{ color: CHROME.textSecondary }}
      >
        <Plus size={12} aria-hidden="true" />
        Add step
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-72 overflow-hidden rounded-xl border border-[#e1e0d9] bg-white shadow-lg"
        >
          {PALETTE.map((entry) => {
            const info = STEP_TYPE_INFO[entry.type];
            const Icon = entry.icon;
            // Inside a parallel branch, three things cannot run — each parks the
            // run using something it keeps exactly one of.
            const blocked = insideParallelBranch && TYPES_FORBIDDEN_IN_BRANCH.includes(entry.type);

            return (
              <button
                key={entry.type}
                type="button"
                role="menuitem"
                disabled={blocked}
                title={blocked ? FORBIDDEN_IN_BRANCH_REASON : undefined}
                onClick={() => {
                  if (blocked) return;
                  onAdd(entry.build({ insideParallelBranch }));
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#fbfaf9] disabled:cursor-not-allowed disabled:hover:bg-transparent"
                style={blocked ? { opacity: 0.45 } : undefined}
              >
                <Icon size={15} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
                    {info.label}
                    {blocked && (
                      <span
                        className="ml-1.5 rounded px-1 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: withAlpha(STATUS.warning, 0.15), color: STATUS.warning }}
                      >
                        not here
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] leading-snug" style={{ color: CHROME.textMuted }}>
                    {info.hint}
                  </span>
                </span>
              </button>
            );
          })}

          {insideParallelBranch && (
            <p
              className="border-t border-[#f1f0ee] px-3 py-2 text-[11px] leading-snug"
              style={{ color: CHROME.textMuted }}
            >
              Some steps are unavailable inside a branch. A run holds one wake-up time, one set of
              branch cursors and one retry slot, so two branches cannot each park on their own.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(StepPalette);
