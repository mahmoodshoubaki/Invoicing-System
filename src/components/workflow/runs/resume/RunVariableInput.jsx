'use client';

import { memo, useMemo } from 'react';

import UserPicker from '@/components/workflow/builder/UserPicker';
import { VARIABLE_TYPE } from '@/constants/workflow';
import { STATUS } from '@/theme/vizPalette';

const controlClass =
  'w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary disabled:bg-gray-50';
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const EMPTY = [];

/**
 * The box for one of a run's values, drawn for its type: a person from the
 * directory (their id is saved; the server takes a username too), yes / no, a
 * date, a list written as JSON, a number, or text.
 *
 * @param {{
 *   row: { name: string, type: string|null }, text: string, onChange: (text: string) => void,
 *   people: Object, invalid?: boolean, disabled?: boolean,
 * }} props
 */
function RunVariableInput({ row, text, onChange, people, invalid = false, disabled = false }) {
  const style = invalid ? { borderColor: STATUS.critical } : undefined;
  const label = `New value for ${row.name}`;
  // Only a name already known: somebody just picked is named by the picker itself.
  const resolved = useMemo(() => {
    const person = text ? people[text] : null;
    return person ? { [text]: { id: text, displayName: person.displayName ?? person.username ?? text } } : undefined;
  }, [people, text]);

  if (row.type === VARIABLE_TYPE.USER) {
    return (
      <UserPicker
        single
        selectedIds={text ? [text] : EMPTY}
        resolvedById={resolved}
        onChange={(ids) => onChange(ids[0] ?? '')}
        placeholder="Search for a person…"
      />
    );
  }
  if (row.type === VARIABLE_TYPE.BOOLEAN) {
    return (
      <select value={text} onChange={(e) => onChange(e.target.value)} aria-label={label} disabled={disabled} className={controlClass} style={style}>
        <option value="">— empty</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }
  if (row.type === VARIABLE_TYPE.DATE && (!text || DAY.test(text))) {
    return <input type="date" value={text} onChange={(e) => onChange(e.target.value)} aria-label={label} disabled={disabled} className={controlClass} style={style} />;
  }
  if (row.type === VARIABLE_TYPE.LIST) {
    return (
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.min(4, Math.max(1, Math.ceil(text.length / 70)))}
        aria-label={label}
        disabled={disabled}
        placeholder='["a","b"]'
        className={`${controlClass} resize-y font-mono`}
        style={style}
      />
    );
  }
  return (
    <input
      type="text"
      inputMode={row.type === VARIABLE_TYPE.NUMBER ? 'decimal' : undefined}
      value={text}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      disabled={disabled}
      className={controlClass}
      style={style}
    />
  );
}

export default memo(RunVariableInput);
