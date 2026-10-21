'use client';

/** A condition group, its rows and its nested groups — what transitions, branches and loops decide by. */

import { memo, useCallback, useMemo } from 'react';
import { CornerDownRight, Info, Plus, Trash2 } from 'lucide-react';

import { MATCH, PICKED_TARGETS_LABEL, PICKED_TARGETS_LIST } from '@/constants/workflow';
import { describeFilterGroup, operatorsForField } from '@/lib/filterDescription';
import { createFilterCondition, createFilterGroup } from '@/models/workflow';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

import { ConditionRow } from './ConditionRow';
import { EMPTY, railColor, someField } from './conditionStyles';

/**
 * A FilterGroup editor, recursive.
 *
 * One component behind six call sites — transition conditions, `branch`,
 * `repeat.until`, `parallel.joinWhen`, `query.filter` and a schedule trigger's
 * `scan`. They differ only in the props: `filterableOnly` for the two that
 * *search* rather than read, and unknown fields being expected for `joinWhen`.
 *
 * ## Why it looks the way it does
 *
 * A group is brackets: it exists so `a and (b or c)` can be said, which means
 * nothing unless a reader can SEE what is bracketed. So containment is drawn,
 * not described — a rail runs down the left of a group's members with the
 * joining word repeated on it, the way a query builder or a filter panel does
 * it. An earlier version relied on a nested box with an alternating background,
 * which left "what does Group even do?" as something you found out by clicking
 * it and guessing.
 *
 * The root also carries a live plain-English reading of the whole expression,
 * so the structure being built and its meaning are visible at the same time.
 *
 * `valueFields` is for a search, whose two sides come from different places:
 * the left names a field of the records being SEARCHED, the right may name
 * one of the RUN's own values (`{{projectCode}}`), filled in once before the
 * search runs. Left out, both sides use `fields`. `recordLabel` renames the
 * "This record" group for the same reason.
 */
function ConditionBuilder({
  value, onChange, fields = EMPTY, depth = 0, filterableOnly = false, builtinsOnly = false,
  valueFields = null, recordLabel = null,
}) {
  // Each `?? []` fallback would otherwise mint a fresh array on every render,
  // changing the identity of everything memoised below it — the exact way a
  // useCallback quietly stops memoising anything.
  const group = useMemo(() => value ?? createFilterGroup(), [value]);
  const conditions = useMemo(() => group.conditions ?? EMPTY, [group]);
  const groups = useMemo(() => group.groups ?? EMPTY, [group]);

  // What a new condition starts on. In a search an unsearchable field is
  // listed, greyed out, but never picked for the author.
  const usableFields = useMemo(
    () => (filterableOnly ? fields.filter((f) => f.filterable) : fields),
    [fields, filterableOnly]
  );

  // Somebody reading a record field on a manual workflow: fine when the run is
  // started on one record, empty when it is started on several.
  const readsRecordOfManyTargets = depth === 0 && someField(group, fields, (f) => f?.emptyOnManyTargets);

  const patch = useCallback((next) => onChange({ ...group, ...next }), [group, onChange]);

  const setCondition = useCallback(
    (index, changes) =>
      patch({ conditions: conditions.map((c, i) => (i === index ? { ...c, ...changes } : c)) }),
    [conditions, patch]
  );

  const addCondition = useCallback(() => {
    const first = usableFields[0];
    patch({
      conditions: [
        ...conditions,
        createFilterCondition({
          field: first?.name ?? '',
          operator: operatorsForField(first?.name, fields)[0],
          value: '',
        }),
      ],
    });
  }, [conditions, fields, patch, usableFields]);

  /**
   * Conditions and nested groups as one ordered list, so the rail can join them
   * with a single sequence of "and"s rather than two separate runs that read as
   * though the groups were somehow separate from the conditions.
   */
  const members = useMemo(
    () => [
      ...conditions.map((data, index) => ({ kind: 'condition', data, index })),
      ...groups.map((data, index) => ({ kind: 'group', data, index })),
    ],
    [conditions, groups]
  );

  const joiner = group.match === MATCH.ANY ? 'or' : 'and';
  const isEmpty = members.length === 0;
  const rail = railColor(depth);

  return (
    <div
      className="rounded-lg border p-2.5"
      style={{ borderColor: '#f1f0ee', backgroundColor: depth === 0 ? '#fbfaf9' : '#ffffff' }}
    >
      {/* Reads as a sentence: "Match ALL of the following" — the toggle is the
          verb of that sentence rather than a pair of unexplained chips. */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px]" style={{ color: CHROME.textMuted }}>Match</span>

        <select
          value={group.match ?? MATCH.ALL}
          onChange={(e) => patch({ match: e.target.value })}
          aria-label="Match all or any"
          className="rounded-md border-0 bg-white px-1.5 py-0.5 text-[11px] font-bold outline-none"
          style={{ color: CHROME.textPrimary, border: `1px solid ${rail}` }}
        >
          <option value={MATCH.ALL}>ALL</option>
          <option value={MATCH.ANY}>ANY</option>
        </select>

        <span className="text-[11px]" style={{ color: CHROME.textMuted }}>
          of the following{members.length > 1 ? ` (${members.length})` : ''}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={addCondition}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
            style={{ color: CHROME.textSecondary }}
          >
            <Plus size={11} aria-hidden="true" />
            Condition
          </button>

          {/* Depth is unlimited in the contract; three levels is where a
              bracketed expression stops being readable on screen. */}
          {depth < 3 && (
            <button
              type="button"
              onClick={() => patch({ groups: [...groups, createFilterGroup()] })}
              title="A group is a bracket: everything inside it is checked together, so you can say “A and (B or C)”."
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
              style={{ color: CHROME.textSecondary }}
            >
              <Plus size={11} aria-hidden="true" />
              Group
            </button>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-dashed px-3 py-3 text-center" style={{ borderColor: '#e1e0d9' }}>
          <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
            {depth === 0
              ? 'No conditions — this matches everything. Leave it empty for an “otherwise” arm.'
              : 'Empty group — add a condition, or remove it.'}
          </p>
          <button
            type="button"
            onClick={addCondition}
            className="mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-[#f1f0ee]"
            style={{ color: CHROME.textSecondary }}
          >
            <Plus size={11} aria-hidden="true" />
            Add the first condition
          </button>
        </div>
      ) : (
        /* The rail. Everything to the right of this line is inside this group,
           and the repeated joining word says how the members combine. */
        <div className="relative pl-5">
          <div
            className="absolute bottom-2 left-1.5 top-2 w-px"
            style={{ backgroundColor: rail }}
            aria-hidden="true"
          />

          <div className="flex flex-col">
            {members.map((member, position) => (
              <div key={`${member.kind}-${member.index}`}>
                {position > 0 && (
                  <div className="relative py-1">
                    <span
                      className="relative -left-3.5 inline-block rounded px-1 text-[10px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: '#fbfaf9', color: rail }}
                    >
                      {joiner}
                    </span>
                  </div>
                )}

                <div className="relative">
                  <div
                    className="absolute -left-3.5 top-1/2 h-px w-3"
                    style={{ backgroundColor: rail }}
                    aria-hidden="true"
                  />

                  {member.kind === 'condition' ? (
                    <ConditionRow
                      condition={member.data}
                      fields={fields}
                      valueFields={valueFields}
                      excludeSelf={valueFields == null}
                      recordLabel={recordLabel}
                      filterableOnly={filterableOnly}
                      builtinsOnly={builtinsOnly}
                      onChange={(changes) => setCondition(member.index, changes)}
                      onRemove={() =>
                        patch({ conditions: conditions.filter((_, i) => i !== member.index) })
                      }
                    />
                  ) : (
                    <div className="flex items-start gap-1.5">
                      <div className="min-w-0 flex-1">
                        <ConditionBuilder
                          value={member.data}
                          onChange={(next) =>
                            patch({ groups: groups.map((g, i) => (i === member.index ? next : g)) })
                          }
                          fields={fields}
                          depth={depth + 1}
                          filterableOnly={filterableOnly}
                          builtinsOnly={builtinsOnly}
                          valueFields={valueFields}
                          recordLabel={recordLabel}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => patch({ groups: groups.filter((_, i) => i !== member.index) })}
                        aria-label="Remove group"
                        className="mt-2 shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1f0ee]"
                        style={{ color: CHROME.textMuted }}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Only at the root: the whole expression as a sentence, so what is being
          built and what it means are on screen together. */}
      {depth === 0 && !isEmpty && (
        <div className="mt-2.5 flex items-start gap-1.5 border-t border-[#f1f0ee] pt-2.5">
          <CornerDownRight
            size={12}
            className="mt-0.5 shrink-0"
            style={{ color: CHROME.textMuted }}
            aria-hidden="true"
          />
          <p className="text-[11px] leading-relaxed" style={{ color: CHROME.textSecondary }}>
            Reads as: <span style={{ color: CHROME.textPrimary }}>{describeFilterGroup(group, fields, 99)}</span>
          </p>
        </div>
      )}

      {filterableOnly && usableFields.length < fields.length && depth === 0 && (
        <p className="mt-2 text-[11px]" style={{ color: CHROME.textMuted }}>
          Greyed-out fields cannot be searched on. They can still be read in a condition elsewhere
          in the workflow.
        </p>
      )}

      {/* The backend's wording, close to: a run started on several records
          reads none of their fields at the top level. Said once, at the root,
          rather than under every row that reads one. */}
      {readsRecordOfManyTargets && (
        <p
          className="mt-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
          style={{ backgroundColor: withAlpha(STATUS.info, 0.08), color: CHROME.textSecondary }}
        >
          <Info size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.info }} aria-hidden="true" />
          <span>
            Record fields read empty when this workflow is started on more than one record. To check
            each of them, loop over &ldquo;{PICKED_TARGETS_LABEL}&rdquo;
            (<code className="font-mono">{PICKED_TARGETS_LIST}</code>) with a For each step.
          </span>
        </p>
      )}
    </div>
  );
}

export default memo(ConditionBuilder);
