'use client';

/** One input an action describes for itself: its label, its type, its choices. */

import { memo, useRef } from 'react';

import TokenPicker from '@/components/workflow/builder/TokenPicker';
import { ACTION_INPUT_TYPE } from '@/constants/workflow';
import { CHROME, STATUS } from '@/theme/vizPalette';

import { controlClass, Label } from './shared';

/**
 * One input an action declared, drawn as the control its type asks for.
 *
 * The point of the whole thing: an input used to be a text box next to its raw
 * key with an example value as a hint, which nobody could be expected to
 * decode. A described input is a labelled control that shows a name and sends a
 * value.
 *
 * `choices` are read live from the module's own source of truth, so an option
 * added server-side appears without a redeploy — nothing here is cached.
 */
export const DescribedInput = memo(function DescribedInput({ input, value, fields, onChange }) {
  const ref = useRef(null);
  const current = value == null ? '' : String(value);

  // A choice set with a placeholder in the box: the run decides which option it
  // lands on, so the dropdown cannot show a selection and says so instead.
  const isPlaceholder = current.includes('{{');

  const control = (() => {
    if (input.typeKey === ACTION_INPUT_TYPE.CHOICE && !isPlaceholder) {
      const known = input.choices.some((c) => c.value === current);
      return (
        <select
          value={current}
          onChange={(e) => onChange(e.target.value)}
          aria-label={input.label}
          className={`${controlClass} min-w-0 flex-1`}
          style={current && !known ? { borderColor: STATUS.critical } : undefined}
        >
          <option value="">{input.required ? 'Choose…' : '— not set —'}</option>
          {input.choices.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
          {/* A saved step naming a choice the module has since dropped stays
              visible rather than silently resetting to nothing. */}
          {current && !known && <option value={current}>{current} — no longer offered</option>}
        </select>
      );
    }

    if (input.typeKey === ACTION_INPUT_TYPE.BOOLEAN && !isPlaceholder) {
      return (
        <select
          value={current}
          onChange={(e) => onChange(e.target.value)}
          aria-label={input.label}
          className={`${controlClass} min-w-0 flex-1`}
        >
          <option value="">— not set —</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    const multiline = input.name === 'body';
    const Control = multiline ? 'textarea' : 'input';
    return (
      <Control
        ref={ref}
        rows={multiline ? 3 : undefined}
        type={!multiline && input.typeKey === ACTION_INPUT_TYPE.NUMBER && !isPlaceholder ? 'number' : undefined}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        aria-label={input.label}
        className={`${controlClass} min-w-0 flex-1 font-mono${multiline ? ' resize-y' : ''}`}
      />
    );
  })();

  return (
    <div>
      <Label hint={input.required ? '— required' : undefined}>{input.label}</Label>
      <div className="flex items-start gap-1.5">
        {control}
        {input.acceptsPlaceholders && (
          <TokenPicker fields={fields} inputRef={ref} value={current} onInsert={onChange} />
        )}
      </div>
      {isPlaceholder && input.choices.length > 0 && (
        <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
          Filled in when the run gets here. It has to end up as one of:{' '}
          {input.choices.map((c) => c.label).join(', ')}.
        </p>
      )}
    </div>
  );
});
