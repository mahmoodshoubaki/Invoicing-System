'use client';

/** Inputs for an action that does not describe its own — plain name / value rows. */

import { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';

import { controlClass, Label } from './shared';
import { TokenField } from './TokenField';

/** Free-form key/value inputs, for an action that describes none of its own. */
export const SimpleInputs = memo(function SimpleInputs({ inputs, fields, onChange }) {
  const entries = Object.entries(inputs);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label hint="— this action does not describe what it takes">Inputs</Label>
        <button
          type="button"
          onClick={() => onChange({ ...inputs, '': '' })}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
          style={{ color: CHROME.textSecondary }}
        >
          <Plus size={11} aria-hidden="true" />
          Input
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>None.</p>
      ) : (
        <ul className="flex flex-col gap-1.5" data-motion>
          {entries.map(([key, value]) => (
            <li key={key} className="flex items-center gap-1.5">
              <input
                value={key}
                onChange={(e) => {
                  const next = { ...inputs };
                  delete next[key];
                  next[e.target.value] = value;
                  onChange(next);
                }}
                aria-label="Input name"
                className={`${controlClass} w-40 shrink-0 font-mono`}
              />
              <div className="min-w-0 flex-1">
                <TokenField
                  value={value ?? ''}
                  onChange={(next) => onChange({ ...inputs, [key]: next })}
                  fields={fields}
                  aria-label="Input value"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = { ...inputs };
                  delete next[key];
                  onChange(next);
                }}
                aria-label="Remove input"
                className="shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1f0ee]"
                style={{ color: CHROME.textMuted }}
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
