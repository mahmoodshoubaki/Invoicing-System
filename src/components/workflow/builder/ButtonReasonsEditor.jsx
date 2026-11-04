'use client';

import { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { OTHER_REASON_KEY, REASON_TEXT_MAX } from '@/lib/taskReasons';
import { CHROME } from '@/theme/vizPalette';
import { uniqueSlug } from '@/utils/slug';

const controlClass =
  'rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-primary';

const emptyOption = () => ({ key: '', label: '' });

/**
 * A button's reasons drop-down: off, or a list of reasons that may be required.
 * Each key is made from its label, never `other`, which the task screen adds itself.
 *
 * @param {{ reasons: { required: boolean, options: Array<{ key: string, label: string }> }|null, onChange: (reasons) => void }} props
 */
function ButtonReasonsEditor({ reasons, onChange }) {
  const options = reasons?.options ?? [];

  const setOptions = (next) => onChange({ ...reasons, options: next });
  const setLabel = (index, label) => {
    const taken = [OTHER_REASON_KEY, ...options.filter((_, i) => i !== index).map((o) => o.key)];
    setOptions(options.map((o, i) => (i === index ? { label, key: uniqueSlug(label, taken, `reason-${index + 1}`) } : o)));
  };

  return (
    <div className="mt-1.5">
      <label className="flex items-center gap-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
        <input
          type="checkbox"
          checked={Boolean(reasons)}
          onChange={(e) => onChange(e.target.checked ? { required: true, options: [emptyOption()] } : null)}
        />
        Asks for a reason
      </label>

      {reasons && (
        <div className="mt-1.5 rounded-md border border-[#f1f0ee] bg-[#fbfaf9] p-2">
          <label className="mb-1.5 flex items-center gap-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
            <input
              type="checkbox"
              checked={reasons.required === true}
              onChange={(e) => onChange({ ...reasons, required: e.target.checked })}
            />
            A reason must be picked
          </label>

          <ul className="flex flex-col gap-1">
            {options.map((option, index) => (
              <li key={index} className="flex items-center gap-1">
                <input
                  value={option.label}
                  onChange={(e) => setLabel(index, e.target.value)}
                  maxLength={REASON_TEXT_MAX}
                  placeholder="Wrong amount"
                  aria-label={`Reason ${index + 1}`}
                  className={`${controlClass} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => setOptions(options.filter((_, i) => i !== index))}
                  aria-label={`Remove reason ${index + 1}`}
                  className="shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1f0ee]"
                  style={{ color: CHROME.textMuted }}
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setOptions([...options, emptyOption()])}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
              style={{ color: CHROME.textSecondary }}
            >
              <Plus size={11} aria-hidden="true" />
              Reason
            </button>
            <span className="text-[10px]" style={{ color: CHROME.textMuted }}>
              &ldquo;Other&rdquo; is always added last, with a box to type in.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ButtonReasonsEditor);
