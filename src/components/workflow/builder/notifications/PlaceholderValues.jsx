'use client';

import { memo } from 'react';
import { Trash2 } from 'lucide-react';

import { TokenField } from '@/components/workflow/builder/automated/TokenField';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { placeholderRows, runValueFor, setPlaceholderValue } from '@/lib/notificationPlaceholders';
import FreePlaceholderValues from './FreePlaceholderValues';

/** One placeholder's box. */
function PlaceholderRow({ row, values, tokens, onChange }) {
  // Left empty, the engine fills a placeholder from a run value of the same
  // name before it falls back on the default — so say which will happen.
  const fromRun = !row.value && !row.stale ? runValueFor(row.key, tokens) : null;

  return (
    <div>
      <div className="mb-0.5 flex items-center gap-1.5">
        <code className="font-mono text-[11px]" style={{ color: row.stale ? CHROME.textMuted : CHROME.textPrimary }}>
          {row.key}
        </code>
        {row.stale && (
          <>
            <span className="text-[10px]" style={{ color: STATUS.warning }}>
              not in this type&rsquo;s words, so it is ignored
            </span>
            <button
              type="button"
              onClick={() => onChange(setPlaceholderValue(values, row.key, ''))}
              aria-label={`Remove the value for ${row.key}`}
              title="Remove"
              className="ml-auto rounded-md p-0.5 transition-colors hover:bg-[#f1f0ee]"
              style={{ color: CHROME.textMuted }}
            >
              <Trash2 size={11} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      <TokenField
        value={row.value}
        onChange={(text) => onChange(setPlaceholderValue(values, row.key, text))}
        fields={tokens}
        placeholder={row.stale ? '' : row.defaultValue || 'no default — stays empty'}
        aria-label={`Value for ${row.key}`}
      />
      {fromRun && (
        <p className="mt-0.5 text-[10px]" style={{ color: CHROME.textMuted }}>
          Left empty, it is filled from <strong>{fromRun.label ?? fromRun.name}</strong>, not from the default.
        </p>
      )}
    </div>
  );
}

/**
 * One box per placeholder of the picked type (2026-10-08), each showing its
 * default in grey. Only filled boxes are saved; an empty one keeps the
 * default. Nothing typed here is refused at save.
 *
 * Without the type list (no Notifications.View), the placeholders cannot be
 * known — FreePlaceholderValues takes names typed by hand instead.
 *
 * @param {{
 *   typeKey: number|null, types: Array|null, values: Object|undefined,
 *   onChange: (values: Object) => void, tokens: Array,
 * }} props
 */
function PlaceholderValues({ typeKey, types, values, onChange, tokens }) {
  if (typeKey == null) return null;
  if (types == null) return <FreePlaceholderValues values={values} onChange={onChange} tokens={tokens} />;

  const type = types.find((t) => t.key === typeKey);
  if (!type) return null;

  const rows = placeholderRows(type.placeholders, values);
  if (rows.length === 0) {
    // A type with no live words is already flagged by its dropdown.
    return type.liveChannelKeys.length > 0 ? (
      <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
        Its words have no values to fill in, beyond the reader&rsquo;s name and the link, which are always filled.
      </p>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#f1f0ee] bg-[#fbfaf9] p-2.5">
      <p className="text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
        Values for its words
        <span className="block font-normal" style={{ color: CHROME.textMuted }}>
          Plain text, a {'{{value}}'} from the run, or both. Empty keeps the grey default. A lone {'{{list}}'} stays
          a list, so a table in the words can loop over it.
        </span>
      </p>
      {rows.map((row) => (
        <PlaceholderRow key={row.key} row={row} values={values} tokens={tokens} onChange={onChange} />
      ))}
    </div>
  );
}

export default memo(PlaceholderValues);
