'use client';

import { memo, useState } from 'react';
import { X } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { isEmailOrPlaceholder } from '@/lib/workflowNotifications';

/**
 * A list of addresses as chips: type one and press Enter (or a comma, or
 * paste several). Each is an address or a `{{field}}` holding one — the field
 * is checked when the run gets there, a typed address is checked now.
 *
 * @param {{ values: string[], onChange: (values: string[]) => void, placeholder?: string, ariaLabel?: string }} props
 */
function EmailListInput({ values, onChange, placeholder = 'name@example.com or {{ClientEmail}}', ariaLabel }) {
  const [draft, setDraft] = useState('');

  const commit = (text) => {
    const parts = String(text).split(/[\s,;]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const next = [...values];
    for (const part of parts) if (!next.includes(part)) next.push(part);
    onChange(next);
    setDraft('');
  };

  return (
    <div
      className="flex min-h-[34px] flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-1 focus-within:border-primary"
    >
      {values.map((value) => {
        const ok = isEmailOrPlaceholder(value);
        return (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1 font-mono text-[11px]"
            style={{
              backgroundColor: ok ? '#f1f0ee' : withAlpha(STATUS.critical, 0.12),
              color: ok ? CHROME.textPrimary : STATUS.critical,
            }}
            title={ok ? value : `"${value}" is not an email address`}
          >
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== value))}
              aria-label={`Remove ${value}`}
              className="rounded-full p-0.5 hover:bg-black/10"
            >
              <X size={10} aria-hidden="true" />
            </button>
          </span>
        );
      })}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Backspace' && !draft && values.length > 0) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          if (/[\s,;]/.test(text.trim())) {
            e.preventDefault();
            commit(text);
          }
        }}
        placeholder={values.length === 0 ? placeholder : ''}
        aria-label={ariaLabel}
        className="min-w-32 flex-1 border-0 bg-transparent px-1 py-0.5 text-xs outline-none"
      />
    </div>
  );
}

export default memo(EmailListInput);
