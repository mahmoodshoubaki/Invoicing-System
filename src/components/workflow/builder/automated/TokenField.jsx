'use client';

/** A text box that takes {{values}} and {{secrets}} from a picker. */

import { memo, useRef } from 'react';

import TokenPicker from '@/components/workflow/builder/TokenPicker';

import { controlClass } from './shared';

/**
 * A text field that accepts `{{…}}`, with the menu that says what may go in it.
 *
 * The ref is what lets the token land at the caret rather than at the end — an
 * address is usually built around a placeholder, not finished with one.
 */
export const TokenField = memo(function TokenField({
  value, onChange, fields, allowSecrets = false, multiline = false, ...rest
}) {
  const ref = useRef(null);
  const Control = multiline ? 'textarea' : 'input';

  return (
    <div className="flex items-start gap-1.5">
      <Control
        ref={ref}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${controlClass} min-w-0 flex-1 font-mono${multiline ? ' resize-y' : ''}`}
        {...rest}
      />
      <TokenPicker
        fields={fields}
        inputRef={ref}
        value={value ?? ''}
        onInsert={onChange}
        allowSecrets={allowSecrets}
      />
    </div>
  );
});
