'use client';

/** A Call API step's request headers. */

import { memo, useMemo } from 'react';
import { KeyRound, Plus, Trash2 } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';

import { controlClass, HEADER_PREFIX, Label, splitInputs } from './shared';
import { TokenField } from './TokenField';

/**
 * The `header.*` rows on an `http.call`.
 *
 * Two kinds of placeholder live in these values and they are NOT the same
 * thing, which the UI has to keep straight because getting it wrong writes a
 * credential into a saved workflow:
 *
 *   {{invoiceNumber}}         a value the run holds, filled in by the engine
 *   {{secrets.PayrollToken}}  a credential, resolved at the last moment and
 *                             never stored in the definition
 *
 * So there is no "token" or "password" field anywhere. A credential is a header
 * whose value is a `{{secrets.Name}}` reference, and the hint says so.
 */
export const HeaderRows = memo(function HeaderRows({ inputs, fields, onInputsChange }) {
  const { headers } = useMemo(() => splitInputs(inputs), [inputs]);

  const setHeader = (name, value) => onInputsChange({ ...inputs, [`${HEADER_PREFIX}${name}`]: value });

  const removeHeader = (name) => {
    const next = { ...inputs };
    delete next[`${HEADER_PREFIX}${name}`];
    onInputsChange(next);
  };

  const renameHeader = (oldName, newName) => {
    const next = { ...inputs };
    const value = next[`${HEADER_PREFIX}${oldName}`];
    delete next[`${HEADER_PREFIX}${oldName}`];
    next[`${HEADER_PREFIX}${newName}`] = value;
    onInputsChange(next);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label hint="— you name these, so the action cannot list them">Headers</Label>
        <button
          type="button"
          onClick={() => setHeader('', '')}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
          style={{ color: CHROME.textSecondary }}
        >
          <Plus size={11} aria-hidden="true" />
          Header
        </button>
      </div>

      {headers.length === 0 ? (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>None.</p>
      ) : (
        <ul className="flex flex-col gap-1.5" data-motion>
          {headers.map(([name, value]) => (
            <li key={name} className="flex items-center gap-1.5">
              <input
                value={name}
                onChange={(e) => renameHeader(name, e.target.value)}
                placeholder="Authorization"
                aria-label="Header name"
                className={`${controlClass} w-40 shrink-0 font-mono`}
              />
              <div className="min-w-0 flex-1">
                {/* Secrets are offered here and only here: a credential is
                    resolvable in a header and must never be readable in a
                    condition. */}
                <TokenField
                  value={value ?? ''}
                  onChange={(next) => setHeader(name, next)}
                  fields={fields}
                  allowSecrets
                  placeholder="Bearer {{secrets.PayrollToken}}"
                  aria-label="Header value"
                />
              </div>
              <button
                type="button"
                onClick={() => removeHeader(name)}
                aria-label="Remove header"
                className="shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1f0ee]"
                style={{ color: CHROME.textMuted }}
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p
        className="mt-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px]"
        style={{ backgroundColor: '#fbfaf9', color: CHROME.textMuted }}
      >
        <KeyRound size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Never paste a real token here — it would be saved inside the workflow. Write{' '}
          <code className="font-mono">{'{{secrets.Name}}'}</code> instead and it is resolved at the
          moment of the call. <code className="font-mono">{'{{variableName}}'}</code> fills in a
          value the run holds.
        </span>
      </p>
    </div>
  );
});
