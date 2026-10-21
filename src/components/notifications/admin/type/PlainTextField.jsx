'use client';

import { useId, useRef } from 'react';

import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import ValueInsertButton from './ValueInsertButton';

/**
 * A subject, or a plain-text body: its length against the server's limit when
 * there is one, and the same Value menu the visual editor has — so an in-app
 * body, which is plain text, can take `{{ Name }}` without it being typed by
 * hand (2026-10-11).
 *
 * @param {{
 *   label: string, value: string, onChange: (value: string) => void,
 *   max?: number|null, rows?: number, dir?: 'ltr'|'rtl', placeholder?: string,
 *   readOnly?: boolean, valueNames?: string[],
 * }} props
 */
export default function PlainTextField({
  label, value, onChange, max = null, rows = 0, dir = 'ltr', placeholder, readOnly, valueNames = [],
}) {
  const id = useId();
  const ref = useRef(null);
  const over = max != null && value.length > max;
  const Control = rows ? 'textarea' : 'input';

  return (
    <div>
      <div className={`${labelClass} flex items-center justify-between gap-2`} style={{ color: CHROME.textSecondary }}>
        <label htmlFor={id}>{label}</label>
        <span className="flex items-center gap-1.5">
          {max != null && (
            <span className="font-normal tabular-nums" style={{ color: over ? STATUS.critical : CHROME.textMuted }}>
              {value.length}/{max}
            </span>
          )}
          {!readOnly && <ValueInsertButton names={valueNames} inputRef={ref} value={value} onChange={onChange} />}
        </span>
      </div>
      <Control
        id={id}
        ref={ref}
        dir={dir}
        value={value}
        rows={rows || undefined}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`${controlClass} w-full ${rows ? 'resize-y leading-relaxed' : ''}`}
        style={over ? { borderColor: STATUS.critical } : undefined}
      />
    </div>
  );
}
