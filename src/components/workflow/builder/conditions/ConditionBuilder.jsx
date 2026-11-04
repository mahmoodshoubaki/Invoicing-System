'use client';

import { memo, useCallback, useMemo } from 'react';
import { CornerDownRight, Info, Plus, Trash2 } from 'lucide-react';

import { MATCH, PICKED_TARGETS_LABEL, PICKED_TARGETS_LIST } from '@/constants/workflow';
import { describeFilterGroup, operatorsForField } from '@/lib/filterDescription';
import { createFilterCondition, createFilterGroup } from '@/models/workflow';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

import { ConditionRow } from './ConditionRow';
import { EMPTY, railColor, someField } from './conditionStyles';

function ConditionBuilder({
  value, onChange, fields = EMPTY, depth = 0, filterableOnly = false, builtinsOnly = false,
  valueFields = null, recordLabel = null,
}) {
  const group = useMemo(() => value ?? createFilterGroup(), [value]);
  const conditions = useMemo(() => group.conditions ?? EMPTY, [group]);
  const groups = useMemo(() => group.groups ?? EMPTY, [group]);

  const usableFields = useMemo(
    () => (filterableOnly ? fields.filter((f) => f.filterable) : fields),
    [fields, filterableOnly]
  );

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
