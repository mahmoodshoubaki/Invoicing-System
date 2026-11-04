'use client';

import { memo } from 'react';
import { Trash2 } from 'lucide-react';

import { FILTER_OPERATOR_OPTION_LABELS, VALUELESS_OPERATORS } from '@/constants/workflow';
import { operatorsForField } from '@/lib/filterDescription';
import { CHROME } from '@/theme/vizPalette';

import { controlClass, GROUP_LABELS } from './conditionStyles';
import { ValueInput } from './ValueInput';

export const ConditionRow = memo(function ConditionRow({
  condition, fields, valueFields, excludeSelf, recordLabel, filterableOnly = false, onChange, onRemove, builtinsOnly = false,
}) {
  const field = fields.find((f) => f.name === condition.field);
  const operators = operatorsForField(condition.field, fields);
  const valueless = VALUELESS_OPERATORS.includes(condition.operator);

  const unknownField = Boolean(condition.field) && !field;

  return (
    <div className="@container flex flex-wrap items-center gap-1.5 rounded-lg border border-[#f1f0ee] bg-white px-2 py-1.5">
      <select
        value={condition.field ?? ''}
        onChange={(e) => {
          const nextOperators = operatorsForField(e.target.value, fields);
          onChange({
            field: e.target.value,
            operator: nextOperators.includes(condition.operator) ? condition.operator : nextOperators[0],
          });
        }}
        aria-label="Field"
        className={`${controlClass} order-1 min-w-0 flex-1 @lg:order-0 @lg:min-w-40`}
        title={unknownField ? `${condition.field} — not in the field list now, and still works` : undefined}
      >
        <option value="">Choose a field…</option>
        {unknownField && <option value={condition.field}>{condition.field}</option>}
        {['record', 'item', 'variable', 'outcome'].map((group) => {
          const inGroup = fields.filter((f) => (f.source ?? 'record') === group);
          if (inGroup.length === 0) return null;
          return (
            <optgroup key={group} label={group === 'record' && recordLabel ? recordLabel : GROUP_LABELS[group]}>
              {inGroup.map((f) => {
                const unsearchable = filterableOnly && !f.filterable;
                return (
                  <option key={f.name} value={f.name} disabled={unsearchable}>
                    {f.label}{unsearchable ? ' — cannot be searched' : ''}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>

      <select
        value={condition.operator ?? ''}
        onChange={(e) => onChange({ operator: e.target.value })}
        aria-label="Comparison"
        className={`${controlClass} order-3 w-full @lg:order-0 @lg:w-auto @lg:shrink-0`}
      >
        {operators.map((op) => (
          <option key={op} value={op}>{FILTER_OPERATOR_OPTION_LABELS[op] ?? op}</option>
        ))}
      </select>

      <div className="order-4 flex w-full min-w-0 items-center @lg:order-0 @lg:w-auto @lg:min-w-fit @lg:flex-1">
        <ValueInput
          field={field}
          fields={valueFields ?? fields}
          value={condition.value}
          onChange={(value) => onChange({ value })}
          disabled={valueless}
          builtinsOnly={builtinsOnly}
          excludeSelf={excludeSelf}
        />
      </div>

      {/* Beside the field when narrow — never on top of a control — and last when wide. */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove condition"
        className="order-2 shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1f0ee] @lg:order-last"
        style={{ color: CHROME.textMuted }}
      >
        <Trash2 size={13} aria-hidden="true" />
      </button>
    </div>
  );
});
