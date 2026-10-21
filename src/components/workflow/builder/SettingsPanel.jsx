'use client';

import { memo } from 'react';
import { CalendarClock, CircleDot, Zap } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';
import {
  PICKED_TARGETS_LABEL, PICKED_TARGETS_LIST, TARGET_TYPE, TARGET_TYPE_LABELS, TRIGGER_KIND,
} from '@/constants/workflow';
import { createTrigger } from '@/models/workflow';
import CronField from './CronField';

/** Events raised by a delete. Named because the screen says something different about them. */
const DELETION_EVENTS = ['InvoiceDeleted', 'BOQItemDeleted'];

const TRIGGER_OPTIONS = [
  {
    kind: TRIGGER_KIND.MANUAL,
    icon: CircleDot,
    label: 'Manual',
    hint: 'Somebody starts it, optionally filling in a short form.',
  },
  {
    kind: TRIGGER_KIND.EVENT,
    icon: Zap,
    label: 'Event',
    hint: 'Starts when something happens in the system.',
  },
  {
    kind: TRIGGER_KIND.SCHEDULE,
    icon: CalendarClock,
    label: 'Schedule',
    hint: 'Runs on a cron schedule.',
  },
];

function Field({ label, hint, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium" style={{ color: CHROME.textSecondary }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
          {hint}
        </p>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary';

/**
 * What the workflow is and what starts it.
 *
 * `targetTypeKey` is the consequential one: it decides which fields the
 * condition builder can offer and which events can start a run. A workflow
 * tracking nothing has no record to scan, so it cannot use a scan-and-spawn
 * schedule — though its Find records steps can still search anything.
 */
function SettingsPanel({ state, dispatch, actions, events, targetTypes, catalogsLoaded }) {
  const { trigger } = state;

  // GetTargetTypes is Workflows.Manage-gated and may not have loaded; the local
  // labels cover the same keys.
  const targetOptions = catalogsLoaded && targetTypes.length > 0
    ? targetTypes.map((t) => ({ key: t.key, label: t.value }))
    : Object.entries(TARGET_TYPE_LABELS).map(([key, label]) => ({ key: Number(key), label }));

  const eventsForTarget = events.filter(
    (e) => e.targetTypeKey == null || e.targetTypeKey === state.targetTypeKey
  );

  /*
   * Nothing raises an event about some kinds of record — projects, today — so
   * an event trigger on one can only fail at save (WF-023). Hidden once the
   * event list has loaded and is known to be empty for this type; kept while
   * it is the trigger already chosen, so a saved definition still shows what
   * it says rather than appearing to have no trigger at all.
   */
  const noEvents = catalogsLoaded && eventsForTarget.length === 0;
  const triggerOptions = TRIGGER_OPTIONS.filter(
    (option) => option.kind !== TRIGGER_KIND.EVENT || !noEvents || trigger?.kind === TRIGGER_KIND.EVENT
  );

  const tracksRecords = state.targetTypeKey != null && state.targetTypeKey !== TARGET_TYPE.NONE;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Description" htmlFor="wf-description">
        <textarea
          id="wf-description"
          rows={2}
          value={state.description}
          onChange={(e) => dispatch({ type: actions.SET_FIELD, field: 'description', value: e.target.value })}
          placeholder="What this workflow is for…"
          className={`${inputClass} resize-y`}
        />
      </Field>

      <Field
        label="Tracks"
        htmlFor="wf-target"
        hint="What each run is about. Conditions can only read fields from this kind of thing."
      >
        <select
          id="wf-target"
          value={state.targetTypeKey ?? ''}
          onChange={(e) => {
            const targetTypeKey = Number(e.target.value);
            dispatch({
              type: actions.SET_TARGET_TYPE,
              targetTypeKey,
              /*
               * Which events survive the change. An event belongs to one kind
               * of record, so most do not — and one left behind would be
               * invisible here (this dropdown filters by target) while still
               * showing on the canvas and still being saved.
               */
              validEventNames: events
                .filter((ev) => ev.targetTypeKey == null || ev.targetTypeKey === targetTypeKey)
                .map((ev) => ev.name),
            });
          }}
          className={inputClass}
        >
          {targetOptions.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </Field>

      <div>
        <p className="mb-1.5 text-xs font-medium" style={{ color: CHROME.textSecondary }}>
          Starts when
        </p>

        <div className="flex flex-col gap-1.5">
          {triggerOptions.map((option) => {
            const Icon = option.icon;
            const selected = trigger?.kind === option.kind;
            return (
              <button
                key={option.kind}
                type="button"
                onClick={() => {
                  // Rebuilt through the model builders so each kind carries only
                  // its own fields — switching away from a schedule must not
                  // leave a stray `cron` in the saved trigger.
                  const next =
                    option.kind === TRIGGER_KIND.EVENT
                      ? createTrigger.event({ eventName: eventsForTarget[0]?.name ?? '' })
                      : option.kind === TRIGGER_KIND.SCHEDULE
                        ? createTrigger.schedule({ cron: '' })
                        : createTrigger.manual({ inputs: [] });
                  dispatch({ type: actions.SET_TRIGGER, trigger: next });
                }}
                aria-pressed={selected}
                className="flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors"
                style={{
                  borderColor: selected ? CHROME.textPrimary : '#f1f0ee',
                  backgroundColor: selected ? '#fbfaf9' : 'transparent',
                }}
              >
                <Icon
                  size={15}
                  className="mt-0.5 shrink-0"
                  style={{ color: selected ? CHROME.textPrimary : CHROME.textMuted }}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
                    {option.label}
                  </span>
                  <span className="block text-[11px]" style={{ color: CHROME.textMuted }}>
                    {option.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {trigger?.kind === TRIGGER_KIND.EVENT && (
        <Field
          label="Event"
          htmlFor="wf-event"
          hint={eventsForTarget.length === 0 ? 'No events are published for this target type.' : undefined}
        >
          <select
            id="wf-event"
            value={trigger.eventName ?? ''}
            onChange={(e) => dispatch({ type: actions.SET_TRIGGER, trigger: createTrigger.event({ eventName: e.target.value }) })}
            className={inputClass}
            disabled={eventsForTarget.length === 0}
          >
            <option value="">Choose an event…</option>
            {eventsForTarget.map((e) => (
              <option key={e.name} value={e.name}>{e.displayName}</option>
            ))}
          </select>
        </Field>
      )}

      {/* InvoiceDeleted / BOQItemDeleted (2026-10-07). The run is about something
          that no longer shows anywhere — it can tell people, not change it. */}
      {trigger?.kind === TRIGGER_KIND.EVENT && DELETION_EVENTS.includes(trigger.eventName) && (
        <p className="rounded-lg bg-[#fbfaf9] px-3 py-2.5 text-[11px] leading-snug" style={{ color: CHROME.textMuted }}>
          The record is already deleted when this runs, so it cannot be changed or linked to. Use the run to
          tell people — a <strong>Send notification</strong> step. Its fields are read just before the delete,
          plus <code className="font-mono">deletedBy</code>, the person who deleted it.
        </p>
      )}

      {trigger?.kind === TRIGGER_KIND.SCHEDULE && (
        <CronField
          value={trigger.cron ?? ''}
          onChange={(cron) => dispatch({ type: actions.SET_TRIGGER, trigger: { ...trigger, cron } })}
        />
      )}

      {trigger?.kind === TRIGGER_KIND.MANUAL && (
        <p className="rounded-lg bg-[#fbfaf9] px-3 py-2.5 text-[11px]" style={{ color: CHROME.textMuted }}>
          Whoever starts a run fills in the variables below that are marked required.
        </p>
      )}

      {/* Where an author decides how conditions read the record, so it is said
          here rather than to whoever starts the run, who cannot change it. */}
      {trigger?.kind === TRIGGER_KIND.MANUAL && tracksRecords && (
        <p className="rounded-lg bg-[#fbfaf9] px-3 py-2.5 text-[11px] leading-snug" style={{ color: CHROME.textMuted }}>
          Started on one record, conditions read that record&rsquo;s fields. Started on more than one,
          record fields read empty — loop over &ldquo;{PICKED_TARGETS_LABEL}&rdquo;
          (<code className="font-mono">{PICKED_TARGETS_LIST}</code>) with a For each step to check each record.
        </p>
      )}

      {trigger?.kind === TRIGGER_KIND.EVENT && noEvents && (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          Nothing raises an event about {TARGET_TYPE_LABELS[state.targetTypeKey]?.toLowerCase() ?? 'this'} records,
          so this workflow cannot be started by one. Choose Manual or Schedule.
        </p>
      )}

    </div>
  );
}

export default memo(SettingsPanel);
