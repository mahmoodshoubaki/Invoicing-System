'use client';

/** A query: the records it searches, its filter, and where the results go. */

import { memo, useMemo } from 'react';

import ConditionBuilder from '@/components/workflow/builder/conditions/ConditionBuilder';
import {
  BUILDER_LIMITS, SEARCHABLE_TARGET_TYPES, TARGET_TYPE, TARGET_TYPE_LABELS, isComparableField,
} from '@/constants/workflow';
import { createFilterGroup } from '@/models/workflow';
import { CHROME } from '@/theme/vizPalette';

import { controlClass, EMPTY_FIELDS, Label, Note } from './shared';

/**
 * Asks a module which of its things match, into a variable.
 *
 * The filter has two sides from two places. The LEFT names a field of the
 * records being searched — BOQ item fields when looking for BOQ items, however
 * the workflow itself is set up. The RIGHT may name one of the run's own
 * values, filled in once before the search runs: "BOQ items whose projectCode
 * is {{projectCode}}" searches for this run's project. Inside a loop that
 * includes the loop item, `{{boq.projectCode}}`.
 */
export const QueryEditor = memo(function QueryEditor({ step, ctx, fields, onChange }) {
  const searchable = SEARCHABLE_TARGET_TYPES.includes(step.targetTypeKey);
  // Never an invoicing plan: it is only asked for by a task (2026-10-13).
  const searched = useMemo(
    () => (ctx.fieldsByTargetType?.[step.targetTypeKey] ?? EMPTY_FIELDS).filter(isComparableField),
    [ctx.fieldsByTargetType, step.targetTypeKey]
  );
  const typeLabel = TARGET_TYPE_LABELS[step.targetTypeKey] ?? 'record';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Label>Look for</Label>
          <select
            value={step.targetTypeKey ?? ''}
            // The filter names fields of the old type, so it goes with it —
            // a BOQ item has no invoiceNumber to search on.
            onChange={(e) => onChange({ targetTypeKey: Number(e.target.value), filter: createFilterGroup() })}
            className={`${controlClass} w-full`}
          >
            {SEARCHABLE_TARGET_TYPES.map((key) => (
              <option key={key} value={key}>{TARGET_TYPE_LABELS[key] ?? `Type ${key}`}</option>
            ))}
            {/* A saved step searching something that cannot be searched stays
                visible rather than silently switching type. */}
            {step.targetTypeKey != null && !searchable && (
              <option value={step.targetTypeKey}>
                {TARGET_TYPE_LABELS[step.targetTypeKey] ?? `Type ${step.targetTypeKey}`} — cannot be searched
              </option>
            )}
          </select>
        </div>

        <div className="w-28">
          <Label hint="— max rows">Limit</Label>
          <input
            type="number"
            min={1}
            value={step.max ?? ''}
            onChange={(e) => onChange({ max: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder={String(BUILDER_LIMITS.DEFAULT_QUERY_MAX)}
            className={`${controlClass} w-full`}
          />
        </div>
      </div>

      {searchable && (
        <div>
          <Label hint={`— ${typeLabel} fields; the value can be one of this run's`}>Matching</Label>
          {searched.length === 0 ? (
            <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
              Loading the {typeLabel.toLowerCase()} fields…
            </p>
          ) : (
            <ConditionBuilder
              value={step.filter ?? createFilterGroup()}
              onChange={(filter) => onChange({ filter })}
              fields={searched}
              valueFields={fields}
              recordLabel={`${typeLabel} fields`}
              filterableOnly
            />
          )}
        </div>
      )}

      <Note>
        {/* `into` is derived from this step's title and never shown — a For-each
            step picks these results by title instead. */}
        The results are available to a <strong>For each</strong> step as
        {' '}&ldquo;{step.title || 'this step'}&rdquo;. A search that matches nothing gives an empty
        list and the run carries on, which is what lets a loop over the results do nothing
        gracefully when nothing matched.
      </Note>

      {step.targetTypeKey === TARGET_TYPE.BOQ_ITEM && (
        <Note>Deleted BOQ items are never found, whatever the filter says.</Note>
      )}

      {step.targetTypeKey === TARGET_TYPE.PROJECT && (
        <Note>
          A project&rsquo;s id is its project code, so inside a loop over these{' '}
          <code className="font-mono">{'{{project.targetId}}'}</code> is the code (&ldquo;P-1&rdquo;).
        </Note>
      )}
    </div>
  );
});
