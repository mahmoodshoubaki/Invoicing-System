'use client';

import { useState } from 'react';

import { controlClass } from '@/components/ui/kit';
import { CHROME } from '@/theme/vizPalette';

const NEW = '__new__';

const sameText = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * @param {{ value: string, categories: string[], onChange: (category: string) => void }} props
 */
export default function CategoryField({ value, categories, onChange }) {
  const [typing, setTyping] = useState(false);

  const known = categories.some((c) => c === value);
  const typed = typing || categories.length === 0 || (value !== '' && !known);

  if (typed) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const existing = categories.find((c) => sameText(c, value));
            if (existing && existing !== value) onChange(existing);
          }}
          maxLength={50}
          autoFocus={typing}
          className={`${controlClass} min-w-0 flex-1`}
          placeholder="New category, like Invoices"
          aria-label="New category"
        />
        {categories.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setTyping(false);
              onChange('');
            }}
            className="shrink-0 rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
            style={{ color: CHROME.textSecondary }}
          >
            Pick one
          </button>
        )}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === NEW) {
          setTyping(true);
          onChange('');
        } else {
          onChange(e.target.value);
        }
      }}
      className={`${controlClass} w-full`}
      aria-label="Category"
    >
      <option value="">Choose a category…</option>
      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      <option value={NEW}>New category…</option>
    </select>
  );
}
