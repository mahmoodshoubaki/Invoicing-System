'use client';

import { memo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { TokenField } from '@/components/workflow/builder/automated/TokenField';
import { controlClass } from '@/components/workflow/builder/containers/shared';
import { CHROME } from '@/theme/vizPalette';
import { setPlaceholderValue } from '@/lib/notificationPlaceholders';

/** A placeholder name as the words write it: letters, digits and underscores. */
const cleanName = (text) => text.replace(/[^A-Za-z0-9_]/g, '');

/**
 * Placeholder values when the type's placeholders cannot be read — the list of
 * types needs Notifications.View. Names are typed by hand; a wrong one is
 * simply ignored by the engine, never refused.
 *
 * @param {{ values: Object|undefined, onChange: (values: Object) => void, tokens: Array }} props
 */
function FreePlaceholderValues({ values, onChange, tokens }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const entries = Object.entries(values ?? {});

  const add = () => {
    if (!name || !text) return;
    onChange(setPlaceholderValue(values, name, text));
    setName('');
    setText('');
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#f1f0ee] bg-[#fbfaf9] p-2.5">
      <p className="text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
        Values for its words
        <span className="block font-normal" style={{ color: CHROME.textMuted }}>
          The type&rsquo;s placeholders cannot be listed without the &ldquo;View notifications&rdquo; permission,
          so type each one&rsquo;s name. One its words do not use is ignored.
        </span>
      </p>

      {entries.map(([key, value]) => (
        <div key={key}>
          <div className="mb-0.5 flex items-center">
            <code className="font-mono text-[11px]" style={{ color: CHROME.textPrimary }}>{key}</code>
            <button
              type="button"
              onClick={() => onChange(setPlaceholderValue(values, key, ''))}
              aria-label={`Remove the value for ${key}`}
              title="Remove"
              className="ml-auto rounded-md p-0.5 transition-colors hover:bg-[#f1f0ee]"
              style={{ color: CHROME.textMuted }}
            >
              <Trash2 size={11} aria-hidden="true" />
            </button>
          </div>
          <TokenField
            value={String(value ?? '')}
            onChange={(next) => onChange(setPlaceholderValue(values, key, next))}
            fields={tokens}
            aria-label={`Value for ${key}`}
          />
        </div>
      ))}

      <div className="flex flex-col gap-1.5 border-t border-[#f1f0ee] pt-2">
        <input
          value={name}
          onChange={(e) => setName(cleanName(e.target.value))}
          placeholder="Placeholder name, like Note"
          aria-label="Placeholder name"
          className={`${controlClass} w-full font-mono`}
        />
        <TokenField
          value={text}
          onChange={setText}
          fields={tokens}
          placeholder="Its value"
          aria-label="Value for the new placeholder"
        />
        <button
          type="button"
          onClick={add}
          disabled={!name || !text}
          className="inline-flex items-center gap-1 self-start rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: CHROME.textSecondary }}
        >
          <Plus size={11} aria-hidden="true" />
          Add value
        </button>
      </div>
    </div>
  );
}

export default memo(FreePlaceholderValues);
