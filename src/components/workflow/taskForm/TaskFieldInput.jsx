'use client';

import { memo, useId } from 'react';

import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';

/**
 * @param {{ field: { name: string, label: string, typeKey: string, required: boolean }, value: string, onChange: (value: string) => void, error?: string|null, disabled?: boolean, options?: Array<{ value: string, label: string }>|null, }} props
 */
function TaskFieldInput({ field, value, onChange, error = null, disabled = false, options = null }) {
  const id = useId();
  const errorId = `${id}-error`;
  const common = {
    id,
    disabled,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
    className: `${controlClass} w-full`,
    style: error ? { borderColor: STATUS.critical } : undefined,
  };

  let control;
  if (options) {
    control = (
      <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        {value && !options.some((o) => o.value === value) && <option value={value}>{value}</option>}
      </select>
    );
  } else if (field.typeKey === 'boolean') {
    control = (
      <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  } else if (field.typeKey === 'date') {
    control = <input {...common} type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  } else if (field.typeKey === 'number') {
    control = (
      <input
        {...common}
        type="text"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="1234.50"
      />
    );
  } else {
    control = <input {...common} type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <div>
      <label htmlFor={id} className={labelClass} style={{ color: CHROME.textSecondary }}>
        {field.label || field.name}
        {field.required && <span style={{ color: STATUS.critical }}> *</span>}
      </label>
      {control}
      {error && (
        <p id={errorId} className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{error}</p>
      )}
    </div>
  );
}

export default memo(TaskFieldInput);
