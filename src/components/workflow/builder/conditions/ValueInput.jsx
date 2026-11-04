'use client';

import { memo, useMemo } from 'react';

import { DatePicker } from '@/components/forms/FormField';
import {
  PLACEHOLDER_BUILTIN,
  PLACEHOLDER_BUILTIN_INFO,
  PLACEHOLDER_OFFSET_UNITS,
  VARIABLE_TYPE,
} from '@/constants/workflow';
import { isPersonField } from '@/lib/workflowFieldOptions';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { readPlaceholder, writeBuiltin, writeName } from '@/utils/workflowPlaceholder';

import { controlClass, EMPTY } from './conditionStyles';
import { PersonValue } from './PersonValue';

export const ValueInput = memo(function ValueInput({
  field, fields, value, onChange, disabled, builtinsOnly = false, excludeSelf = true,
}) {
  const type = field?.typeKey;
  const person = isPersonField(field);
  const parsed = readPlaceholder(value);

  const mode = parsed.kind === 'builtin' || parsed.kind === 'name' ? parsed.kind : 'literal';

  // Only a date can sensibly be compared against a moment in time.
  const offersBuiltins = type === VARIABLE_TYPE.DATE;

  const comparable = useMemo(
    () => (fields ?? EMPTY).filter((f) => {
      if (excludeSelf && f.name === field?.name) return false;
      if (f.outcomeValues) return false;
      return person ? isPersonField(f) : f.typeKey === type;
    }),
    [fields, field, type, person, excludeSelf]
  );

  const offersNames = comparable.length > 0 && !builtinsOnly;

  if (disabled) {
    return (
      <span className="shrink-0 px-1 text-xs italic" style={{ color: CHROME.textMuted }}>
        no value needed
      </span>
    );
  }

  if (field?.outcomeValues) {
    return (
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Value"
        className={`${controlClass} min-w-0 flex-1`}
      >
        <option value="">Choose an answer…</option>
        {field.outcomeValues.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
        {value && !field.outcomeValues.some((o) => o.key === value) && (
          <option value={value}>{value} — no longer an outcome</option>
        )}
      </select>
    );
  }

  const changeMode = (next) => {
    if (next === 'literal') onChange('');
    else if (next === 'name') onChange(writeName(comparable[0]?.name ?? ''));
    else onChange(writeBuiltin(next));
  };

  const hasModes = offersBuiltins || offersNames;
  const modeSelect = (className = 'shrink-0') => hasModes && (
    <select
      value={mode === 'builtin' ? parsed.name : mode}
      onChange={(e) => changeMode(e.target.value)}
      aria-label="What to compare against"
      className={`${controlClass} ${className}`}
      style={{ maxWidth: 118 }}
    >
      <option value="literal">{person ? 'A person' : 'A value'}</option>
      {offersBuiltins && Object.values(PLACEHOLDER_BUILTIN).map((b) => (
        <option key={b} value={b} title={PLACEHOLDER_BUILTIN_INFO[b].hint}>
          {PLACEHOLDER_BUILTIN_INFO[b].label}
        </option>
      ))}
      {offersNames && <option value="name">Another field</option>}
    </select>
  );

  if (mode === 'builtin') {
    return (
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {modeSelect('min-w-0 flex-1 basis-16')}
        <span className="flex shrink-0 items-center gap-1.5">
        <select
          value={parsed.sign}
          onChange={(e) => onChange(writeBuiltin(parsed.name, { ...parsed, sign: e.target.value }))}
          aria-label="Before or after"
          className={`${controlClass} shrink-0`}
        >
          <option value="+">plus</option>
          <option value="-">minus</option>
        </select>
        <input
          type="number"
          min={0}
          value={parsed.amount}
          onChange={(e) => onChange(writeBuiltin(parsed.name, { ...parsed, amount: Number(e.target.value) || 0 }))}
          aria-label="Offset amount"
          className={`${controlClass} w-16 shrink-0`}
        />
        <select
          value={parsed.unit}
          onChange={(e) => onChange(writeBuiltin(parsed.name, { ...parsed, unit: e.target.value }))}
          aria-label="Offset unit"
          className={`${controlClass} shrink-0`}
        >
          {PLACEHOLDER_OFFSET_UNITS.map((u) => (
            <option key={u.key} value={u.key}>{u.label}</option>
          ))}
        </select>
        </span>
      </div>
    );
  }

  if (mode === 'name') {
    const known = comparable.some((f) => f.name === parsed.name);
    return (
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {modeSelect()}
        <select
          value={parsed.name}
          onChange={(e) => onChange(writeName(e.target.value))}
          aria-label="Field to compare against"
          className={`${controlClass} min-w-0 flex-1`}
          style={known ? undefined : { borderColor: STATUS.critical }}
        >
          {comparable.map((f) => (
            <option key={f.name} value={f.name}>{f.label}</option>
          ))}
          {!known && <option value={parsed.name}>{parsed.name} — unknown</option>}
        </select>
      </div>
    );
  }

  const literalControl =
    person ? (
      <PersonValue field={field} value={value} onChange={onChange} />
    ) : field?.valueOptions ? (
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Value"
        className={`${controlClass} min-w-0 flex-1`}
      >
        <option value="">Choose…</option>
        {field.valueOptions.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
        {value && !field.valueOptions.some((o) => o.key === String(value)) && (
          <option value={value}>{value} — not in the list any more</option>
        )}
      </select>
    ) : type === VARIABLE_TYPE.BOOLEAN ? (
      <select
        value={value === '' ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Value"
        className={`${controlClass} min-w-0 flex-1`}
      >
        <option value="">Choose…</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    ) : type === VARIABLE_TYPE.DATE ? (
      <div className="min-w-0 flex-1">
        <DatePicker value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      </div>
    ) : (
      <input
        type={type === VARIABLE_TYPE.NUMBER ? 'number' : 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="value"
        aria-label="Value"
        className={`${controlClass} min-w-0 flex-1`}
      />
    );

  if (!hasModes) return literalControl;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      {modeSelect()}
      {literalControl}
    </div>
  );
});
