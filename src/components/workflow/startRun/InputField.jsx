'use client';

import { DatePicker } from '@/components/forms/FormField';
import UserPicker from '@/components/workflow/builder/UserPicker';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { VARIABLE_TYPE } from '@/constants/workflow';
import { emptyForType } from '@/lib/workflowBuilderState';
import { controlClass } from './startRunShared';

/**
 * One field on the little form a manual trigger declares.
 *
 * The control follows the declared `type`, and the placeholder says what the
 * run starts with when the box is left alone — a default now applies whatever
 * started the run, so a blank box is a real value rather than an absence.
 */
export default function InputField({ variable, value, onChange, problem }) {
  const label = variable.label || variable.name;
  const placeholder = variable.defaultValue ?? emptyForType(variable.type);

  const control = (() => {
    if (variable.type === VARIABLE_TYPE.BOOLEAN) {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={controlClass}>
          <option value="">{placeholder}</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }
    if (variable.type === VARIABLE_TYPE.DATE) {
      return <DatePicker value={value} onChange={(e) => onChange(e.target.value)} />;
    }
    // A person is picked, and their user id is what is sent — the engine
    // refuses anything else. Left empty, the declared default applies.
    if (variable.type === VARIABLE_TYPE.USER) {
      return (
        <UserPicker
          single
          selectedIds={value ? [value] : []}
          onChange={(ids) => onChange(ids[0] ?? '')}
          placeholder={variable.defaultValue ? 'Leave empty for the default person, or search…' : 'Search for a person…'}
        />
      );
    }
    return (
      <input
        type={variable.type === VARIABLE_TYPE.NUMBER ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={String(placeholder)}
        aria-label={label}
        className={controlClass}
        style={problem ? { borderColor: STATUS.critical } : undefined}
      />
    );
  })();

  return (
    <div>
      <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
        {label}
        {variable.required && <span className="ml-1 font-normal" style={{ color: CHROME.textMuted }}>— required</span>}
      </p>
      {control}
      {problem && (
        <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{problem}</p>
      )}
    </div>
  );
}
