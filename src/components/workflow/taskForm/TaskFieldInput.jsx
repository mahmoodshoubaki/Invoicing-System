'use client';

import { memo, useId } from 'react';
import { useTranslations } from 'next-intl';

import { controlClass, labelClass } from '@/components/ui/kit';
import { TASK_FIELD_HINT_KEYS, TASK_MONEY_FIELDS } from '@/constants/taskFieldHints';
import { CHROME, STATUS } from '@/theme/vizPalette';

/**
 * @param {{ field: { name: string, label: string, typeKey: string, required: boolean }, value: string, onChange: (value: string) => void, error?: string|null, disabled?: boolean, options?: Array<{ value: string, label: string }>|null, }} props
 */
function TaskFieldInput({ field, value, onChange, error = null, disabled = false, options = null }) {
  const t = useTranslations('tasks.form');
  const tc = useTranslations('common');
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hint = [
    TASK_FIELD_HINT_KEYS.has(field.name) ? t(`hints.${field.name}`) : null,
    TASK_MONEY_FIELDS.has(field.name) ? tc('amountsInUsd') : null,
  ].filter(Boolean).join(' ') || null;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    disabled,
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy,
    className: `${controlClass} w-full`,
    style: error ? { borderColor: STATUS.critical } : undefined,
  };

  let control;
  if (options) {
    control = (
      <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('choose')}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        {value && !options.some((o) => o.value === value) && <option value={value}>{value}</option>}
      </select>
    );
  } else if (field.typeKey === 'boolean') {
    control = (
      <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        <option value="true">{t('yes')}</option>
        <option value="false">{t('no')}</option>
      </select>
    );
  } else if (field.typeKey === 'date') {
    control = <input {...common} type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  } else if (field.typeKey === 'number') {
    control = (
      <input
        {...common}
        type="text"
        dir="ltr"
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
      {hint && (
        <p id={hintId} className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>{hint}</p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{error}</p>
      )}
    </div>
  );
}

export default memo(TaskFieldInput);
