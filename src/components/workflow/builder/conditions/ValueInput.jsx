'use client';

/** The value side of one condition — a box that suits the field and the operator. */

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

/**
 * The value input, shaped by the field's type.
 *
 * Whatever the control, the value leaves here as a **string** — the server
 * parses it against the property's real type, and sending a JSON number would
 * work by accident today and break the moment the backend tightens binding.
 *
 * `fields` is what the right-hand side may name ("Another field"). Usually the
 * same list the left-hand field came from; in a search it is the RUN's fields
 * instead, and then a field of the same name is the useful case — BOQ items
 * whose projectCode is this run's projectCode — so `excludeSelf` is off.
 */
export const ValueInput = memo(function ValueInput({
  field, fields, value, onChange, disabled, builtinsOnly = false, excludeSelf = true,
}) {
  const type = field?.typeKey;
  const person = isPersonField(field);
  const parsed = readPlaceholder(value);

  /*
   * The right-hand side is one of three things, and the control has to say
   * which — a bare text box would let somebody type `{{reviewDeadline+7d}}`,
   * which reads as the obvious extension of `{{today+7d}}` and is refused at
   * save. Offsets belong to the built-ins' grammar, so the offset control only
   * exists while a built-in is chosen.
   */
  const mode = parsed.kind === 'builtin' || parsed.kind === 'name' ? parsed.kind : 'literal';

  // Only a date can sensibly be compared against a moment in time.
  const offersBuiltins = type === VARIABLE_TYPE.DATE;

  /*
   * What can appear on the right: anything of the same type. Comparing a date
   * to a text field is not a thing the engine can do, and offering it would
   * produce a run-time parse failure rather than a save-time one.
   */
  const comparable = useMemo(
    () => (fields ?? EMPTY).filter((f) => {
      if (excludeSelf && f.name === field?.name) return false;
      if (f.outcomeValues) return false;
      // A person compares with a person, whichever way each is stored —
      // `submittedBy` is text that holds a user id; a person variable is `user`.
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

  // A step's answer can only be one of the outcomes that step defines, so the
  // author picks a button by name instead of typing its key — which is why the
  // key never has to be shown anywhere in the builder.
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
        {/* A saved condition naming an outcome that has since been renamed or
            deleted stays visible rather than silently resetting. */}
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
  // `className` lets the date form below give it a share of the line rather than its full width.
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

  /*
   * A built-in, with the offset that only built-ins may carry.
   *
   * The offset — plus / 0 / days — is one unit that never splits, and the
   * built-in's own box gives up width before it does (a small flex basis), so
   * "Today plus 0 days" stays one line in the side panel. Narrower still, the
   * offset moves to the next line whole.
   */
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

  /* Another field or variable, resolved while the run is going. */
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
      // A lookup id: the author picks "Submitted", and 3 is what is saved.
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
