'use client';

import { memo } from 'react';
import { AlarmClock, Info, Plus, Trash2 } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { readableTextOn, withAlpha } from '@/utils/color';
import { createOutcome } from '@/models/workflow';
import { uniqueSlug } from '@/utils/slug';
import { readPlaceholder, writeName } from '@/utils/workflowPlaceholder';
import UserPicker from './UserPicker';
import RoleChips from './RoleChips';
import DurationFields from './DurationFields';

const controlClass =
  'rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary';

/** Sensible starting colours for outcome buttons — green to go, red to stop. */
const OUTCOME_SWATCHES = ['#16A34A', '#DC2626', '#2563EB', '#D97706', '#6B7280'];

function Label({ children, hint }) {
  return (
    <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
      {children}
      {hint && <span className="ml-1 font-normal" style={{ color: CHROME.textMuted }}>{hint}</span>}
    </p>
  );
}

/**
 * A step that stops and waits for a person.
 *
 * The outcomes edited here are literally the buttons My Tasks renders — key,
 * label, colour and whether a comment is mandatory all travel to that screen
 * untouched. So this editor is a preview as much as a form.
 */
/** Where a person-holding name comes from, for the picker's groups. */
const PERSON_SOURCE_LABELS = {
  record: 'On the record',
  item: 'On the loop item',
  variable: 'Person variables',
};

/**
 * Assignees named by the run rather than chosen up front.
 *
 * Two kinds of name hold a person: a record field whose `GetFields` row says
 * `isUser` (`submittedBy` on invoices and, since 2026-10-01, BOQ items), and a
 * variable of the person type — `{{approver}}`. Only those are offered: naming
 * anything else is refused at save as WF-038, and a picker that let somebody
 * assign a to-do to `totalAmount` would be handing them a save error instead of
 * a form. Projects have person fields since 2026-10-20 — `bdmUsername`,
 * `crpUsername`, `buHeadUsername`, holding usernames — and a BOQ or invoice
 * workflow reaches them by finding its project with a query step and looping
 * over it: `{{project.bdmUsername}}` is then offered as a loop item's field.
 *
 * A name the catalog does not know is kept and flagged rather than dropped —
 * a definition saved before a variable was renamed, say.
 */
export const ExpressionAssignees = memo(function ExpressionAssignees({ expressions, fields, onChange }) {
  const userFields = (fields ?? []).filter((f) => f.isUser);
  const chosen = expressions.map((e) => readPlaceholder(e).name ?? '');

  const add = (name) => onChange([...expressions, writeName(name)]);
  const removeAt = (index) => onChange(expressions.filter((_, i) => i !== index));

  const unused = userFields.filter((f) => !chosen.includes(f.name));

  if (userFields.length === 0 && expressions.length === 0) {
    return (
      <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
        Nothing in this workflow holds a person yet. Add a variable of type <strong>person</strong> to
        assign this task to whoever it holds.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {expressions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {expressions.map((expression, index) => {
            const name = chosen[index];
            const field = userFields.find((f) => f.name === name);
            // A variable or loop item is legitimate and unresolvable here.
            const unknown = !field;
            return (
              <span
                key={`${expression}-${index}`}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  backgroundColor: withAlpha(STATUS.info, 0.14),
                  color: STATUS.info,
                  border: `1px solid ${withAlpha(STATUS.info, 0.4)}`,
                }}
                title={
                  unknown
                    ? 'Not a field or variable this workflow knows — resolved while the run is going'
                    : field.source === 'variable'
                      ? 'Whoever this variable holds when the task is created'
                      : field.label
                }
              >
                {field ? field.label : name}
                {unknown && <span style={{ color: CHROME.textMuted }}>· at run time</span>}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove ${field ? field.label : name}`}
                  className="ml-0.5 opacity-60 transition-opacity hover:opacity-100"
                >
                  <Trash2 size={11} aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {unused.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && add(e.target.value)}
          aria-label="Add a person held by the record or a variable"
          className={`${controlClass} w-full`}
        >
          <option value="">Add a person from the record or a variable…</option>
          {['record', 'item', 'variable'].map((source) => {
            const inGroup = unused.filter((f) => (f.source ?? 'record') === source);
            if (inGroup.length === 0) return null;
            return (
              <optgroup key={source} label={PERSON_SOURCE_LABELS[source]}>
                {inGroup.map((f) => (
                  <option key={f.name} value={f.name}>{f.label}</option>
                ))}
              </optgroup>
            );
          })}
        </select>
      )}
    </div>
  );
});

/**
 * The task itself — who answers, by when, and with which buttons. Who hears
 * about it is the Notifications tab (TaskNotificationsPanel), beside this one.
 */
function HumanTaskEditor({ step, stageId, stages, roles, rolesLoading, resolvedById, fields, onChange }) {
  const outcomes = step.outcomes ?? [];
  const assignedRoles = step.assignToRoleIds ?? [];

  const patchOutcome = (index, patch) =>
    onChange({ outcomes: outcomes.map((o, i) => (i === index ? { ...o, ...patch } : o)) });

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <Label>Assign to roles</Label>

        <RoleChips
          roles={roles}
          loading={rolesLoading}
          selectedIds={assignedRoles}
          onChange={(assignToRoleIds) => onChange({ assignToRoleIds })}
        />
      </div>

      <div>
        <Label hint="— as well as, or instead of, roles">Assign to people</Label>
        <UserPicker
          resolvedById={resolvedById}
          selectedIds={step.assignToUserIds ?? []}
          onChange={(assignToUserIds) => onChange({ assignToUserIds })}
        />
      </div>

      {/*
        The third assignee source, and the only one that is not decided when the
        workflow is drawn: it names a field, and whoever that field holds on the
        particular record gets the to-do.
      */}
      <div>
        <Label hint="— decided when the task is created">
          Assign to a person on the record or in a variable
        </Label>
        <ExpressionAssignees
          expressions={step.assignToExpressions ?? []}
          fields={fields}
          onChange={(assignToExpressions) => onChange({ assignToExpressions })}
        />
      </div>

      {assignedRoles.length + (step.assignToUserIds?.length ?? 0) + (step.assignToExpressions?.length ?? 0) > 1 && (
        <p
          className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px]"
          style={{ backgroundColor: '#fbfaf9', color: CHROME.textMuted }}
        >
          <Info size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
          {/* Settled engine behaviour, not a limitation — two approvals that are
              both genuinely required are two steps, which `parallel` writes. */}
          The assignee list is who <em>may</em> answer, not a set of answers to collect. Whoever
          responds first completes the step.
        </p>
      )}

      <div>
        <Label hint="— optional; without one the task never becomes overdue">Due in</Label>
        <DurationFields source={step} prefix="dueIn" onChange={onChange} optional />
      </div>

      <div className="rounded-lg border border-[#f1f0ee] bg-[#fbfaf9] p-2.5">
        <label className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
          <input
            type="checkbox"
            checked={Boolean(step.overdue)}
            onChange={(e) =>
              onChange({
                overdue: e.target.checked
                  ? { toStageId: stages.find((s) => s.id !== stageId)?.id ?? '', comeBack: false }
                  : undefined,
              })
            }
          />
          <AlarmClock size={12} aria-hidden="true" />
          If nobody answers by then
        </label>

        {step.overdue ? (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px]" style={{ color: CHROME.textMuted }}>go to</span>
              <select
                value={step.overdue.toStageId ?? ''}
                onChange={(e) => onChange({ overdue: { ...step.overdue, toStageId: e.target.value } })}
                aria-label="Escalation stage"
                className={`${controlClass} min-w-40 flex-1`}
              >
                <option value="">Choose a stage…</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.title || s.id}</option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-1.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
              <input
                type="checkbox"
                className="mt-0.5"
                checked={step.overdue.comeBack === true}
                onChange={(e) => onChange({ overdue: { ...step.overdue, comeBack: e.target.checked } })}
              />
              <span>
                and come back when they Finish it
                <span className="block" style={{ color: CHROME.textMuted }}>
                  {/* The whole difference between the two escalating behaviours. */}
                  {step.overdue.comeBack
                    ? 'The task stays open. Whoever answers it brings the run back here and it carries on from the next step.'
                    : 'The task is cancelled when the stage changes. It does not come back.'}
                </span>
              </span>
            </label>
          </div>
        ) : (
          <p className="mt-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
            Nothing happens — the task simply shows as overdue in its owner&rsquo;s list.
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label>Outcomes — the buttons the person sees</Label>
          <button
            type="button"
            onClick={() =>
              onChange({
                outcomes: [
                  ...outcomes,
                  createOutcome({
                    key: '',
                    label: '',
                    colorHex: OUTCOME_SWATCHES[outcomes.length % OUTCOME_SWATCHES.length],
                  }),
                ],
              })
            }
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
            style={{ color: CHROME.textSecondary }}
          >
            <Plus size={11} aria-hidden="true" />
            Outcome
          </button>
        </div>

        {outcomes.length === 0 ? (
          <p
            className="rounded-md border border-dashed px-2.5 py-2 text-[11px]"
            style={{ borderColor: '#e1e0d9', color: CHROME.textMuted }}
          >
            No outcomes — the person would have no buttons to press.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5" data-motion>
            {outcomes.map((outcome, index) => (
              <li key={index} className="rounded-lg border border-[#f1f0ee] bg-white p-2">
                <div className="flex items-center gap-1.5">
                  <input
                    value={outcome.label ?? ''}
                    onChange={(e) => {
                      // The key is what the engine stores, and it is derived
                      // rather than shown: an author naming a button should not
                      // also have to invent an identifier for it. Kept unique
                      // within the step, since two outcomes sharing a key is a
                      // save error nobody could act on if they never saw them.
                      const label = e.target.value;
                      const taken = outcomes.filter((_, i) => i !== index).map((o) => o.key);
                      patchOutcome(index, { label, key: uniqueSlug(label, taken, `outcome-${index + 1}`) });
                    }}
                    placeholder="Approve"
                    aria-label="Outcome label"
                    className={`${controlClass} min-w-0 flex-1`}
                  />

                  <input
                    type="color"
                    value={outcome.colorHex ?? '#6B7280'}
                    onChange={(e) => patchOutcome(index, { colorHex: e.target.value })}
                    aria-label="Outcome colour"
                    className="h-7 w-8 shrink-0 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                  />

                  <button
                    type="button"
                    onClick={() => onChange({ outcomes: outcomes.filter((_, i) => i !== index) })}
                    aria-label="Remove outcome"
                    className="shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1f0ee]"
                    style={{ color: CHROME.textMuted }}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
                    <input
                      type="checkbox"
                      checked={outcome.requiresComment === true}
                      onChange={(e) => patchOutcome(index, { requiresComment: e.target.checked })}
                    />
                    Requires a comment
                  </label>

                  {/* Only once the task asks for fields (its Fields tab). */}
                  {(step.fields?.length ?? 0) > 0 && (
                    <label className="flex items-center gap-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
                      <input
                        type="checkbox"
                        checked={outcome.requiresFields === true}
                        onChange={(e) => patchOutcome(index, { requiresFields: e.target.checked })}
                      />
                      Saves the fields
                    </label>
                  )}

                  {/* Exactly how My Tasks will draw it. */}
                  <span
                    className="rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      backgroundColor: outcome.colorHex ?? '#f1f0ee',
                      color: readableTextOn(outcome.colorHex, CHROME.textPrimary),
                    }}
                  >
                    {outcome.label || 'Button'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

export default memo(HumanTaskEditor);
