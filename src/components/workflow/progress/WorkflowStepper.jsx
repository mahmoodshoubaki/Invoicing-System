'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, Check, CircleSlash, Hourglass, Pause, X } from 'lucide-react';

import { STEP, TONE } from '@/lib/workflowProgress';
import { waitingOnText } from '@/lib/waitingOn';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { colors } from '@/theme';

const TONE_COLOR = {
  [TONE.GOOD]: STATUS.good,
  [TONE.BAD]: STATUS.critical,
  [TONE.NEUTRAL]: STATUS.neutral,
  [TONE.WARNING]: '#F59E0B',
};

/** A step's circle: ticked when done, pulsing where the record is, dashed for what comes next. */
function Marker({ step, number }) {
  const color = TONE_COLOR[step.tone] ?? colors.primary;
  if (step.state === STEP.DONE) {
    const Icon = step.tone === TONE.BAD ? X : step.tone === TONE.NEUTRAL ? CircleSlash : Check;
    return (
      <span className="grid h-8 w-8 place-items-center rounded-full text-white shadow-sm" style={{ backgroundColor: color }}>
        <Icon size={15} strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  if (step.state === STEP.CURRENT) {
    const Icon = step.tone === TONE.BAD ? AlertTriangle : step.tone === TONE.WARNING ? Pause : null;
    return (
      <span className="relative grid h-8 w-8 place-items-center">
        <span className="absolute inset-0 rounded-full opacity-40 motion-safe:animate-ping" style={{ backgroundColor: color }} aria-hidden="true" />
        <span
          className="relative grid h-8 w-8 place-items-center rounded-full border-2 bg-white"
          style={{ borderColor: color, boxShadow: `0 0 0 4px ${withAlpha(color, 0.15)}` }}
        >
          {Icon
            ? <Icon size={14} style={{ color }} aria-hidden="true" />
            : <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />}
        </span>
      </span>
    );
  }
  if (step.state === STEP.NEXT) {
    return (
      <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-dashed bg-white" style={{ borderColor: withAlpha(colors.primary, 0.6), color: colors.primary }}>
        <ArrowRight size={14} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#e1e0d9] bg-white text-[11px] font-semibold" style={{ color: CHROME.textMuted }}>
      {number}
    </span>
  );
}

/** The line from a step to the next one: drawn in once the step is done. */
function Connector({ done, index }) {
  return (
    <span className="absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-4 h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-[#ecebe6]" aria-hidden="true">
      {done && (
        <motion.span
          className="block h-full origin-left rounded-full"
          style={{ backgroundColor: colors.primary }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.45, delay: 0.12 * index, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </span>
  );
}

/**
 * A record's progress through its workflow (2026-10-21) — change requests,
 * invoices and BOQ items: each step ticked, pulsing where the record is, or
 * dashed for what comes next; what is next in a sentence when it can be
 * known; and who it is waiting on, from the record's own `waitingOn` — so a
 * reader who may not see workflows still learns who has it.
 *
 * A long workflow scrolls sideways to the step it is on.
 *
 * @param {{
 *   steps: Array, next: string|null, ready: boolean,
 *   waitingOn?: Array,  the record's own
 *   hereLabel?: string, label: string,  what the steps are of, for screen readers
 *   emptyMessage?: string|null,  said instead of the steps — a record no workflow runs on
 * }} props
 */
export default function WorkflowStepper({ steps, next, ready, waitingOn = null, hereLabel = 'Now', label, emptyMessage = null }) {
  const trackRef = useRef(null);
  const waiting = waitingOnText(waitingOn);

  useEffect(() => {
    const track = trackRef.current;
    const here = track?.querySelector('[aria-current="step"]');
    if (!track || !here) return;
    track.scrollLeft = Math.max(0, here.offsetLeft - (track.clientWidth - here.clientWidth) / 2);
  }, [steps]);

  return (
    <section aria-label="Progress" className="mb-5 rounded-2xl border border-[#e9e7e5] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: CHROME.textMuted }}>Where it is</p>
        {ready && next && !emptyMessage && (
          <p
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: withAlpha(colors.primary, 0.08), color: colors.primary }}
          >
            <ArrowRight size={12} aria-hidden="true" />
            Next: {next}
          </p>
        )}
      </div>

      {ready && emptyMessage ? (
        <p className="text-xs" style={{ color: CHROME.textMuted }}>{emptyMessage}</p>
      ) : !ready ? (
        <div className="flex items-center gap-3 py-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="flex flex-1 items-center gap-3">
              <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[#ecebe6]" />
              {i < 3 && <span className="h-0.5 flex-1 rounded-full bg-[#ecebe6]" />}
            </span>
          ))}
        </div>
      ) : (
        <ol ref={trackRef} className="relative flex overflow-x-auto pb-1 pt-3" aria-label={label}>
          {steps.map((step, i) => {
            const current = step.state === STEP.CURRENT;
            const color = TONE_COLOR[step.tone] ?? colors.primary;
            return (
              <li
                key={step.key}
                aria-current={current ? 'step' : undefined}
                className="relative flex flex-1 flex-col items-center px-2 text-center"
              >
                {i < steps.length - 1 && <Connector done={step.state === STEP.DONE} index={i} />}
                <Marker step={step} number={i + 1} />
                <p
                  className="mt-2 text-xs font-semibold leading-snug"
                  style={{ color: current ? color : step.state === STEP.UPCOMING ? CHROME.textMuted : CHROME.textPrimary }}
                >
                  {step.title}
                </p>
                {(current || step.state === STEP.NEXT) && (
                  <span
                    className="mt-1 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide"
                    style={current
                      ? { backgroundColor: color, color: '#fff' }
                      : { backgroundColor: withAlpha(colors.primary, 0.1), color: colors.primary }}
                  >
                    {current ? hereLabel : 'Next'}
                  </span>
                )}
                {step.note && (
                  <p className="mt-1 line-clamp-2 text-[10px] leading-snug" style={{ color: CHROME.textMuted }} title={step.note}>
                    {step.note}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {waiting && (
        <p
          className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
          style={{ backgroundColor: withAlpha(STATUS.info, 0.07), color: CHROME.textPrimary }}
        >
          <Hourglass size={13} className="mt-0.5 shrink-0" style={{ color: STATUS.info }} aria-hidden="true" />
          <span><span className="font-semibold">Waiting on: </span>{waiting}</span>
        </p>
      )}
    </section>
  );
}
