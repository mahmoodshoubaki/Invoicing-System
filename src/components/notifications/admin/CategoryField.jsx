'use client';

import { useState } from 'react';

import { controlClass } from '@/components/ui/kit';
import { CHROME } from '@/theme/vizPalette';

const NEW = '__new__';

const sameText = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * A notification type's category: picked from the ones the types already
 * use, or a new one typed in.
 *
 * It used to be a text box with the browser's suggestion list, which looks
 * like a dropdown and does not open like one — the suggestions only appear on
 * ↓ or matching letters. Now the existing categories are a real list, and
 * "New category…" turns it into a text box. A typed name that matches an
 * existing one, ignoring case, takes that one's spelling, so "invoices" does
 * not start a second "Invoices" group.
 *
 * @param {{ value: string, categories: string[], onChange: (category: string) => void }} props
 */
export default function CategoryField({ value, categories, onChange }) {
  const [typing, setTyping] = useState(false);

  // Typing when asked to, when there is nothing to pick from, or when the
  // current value is not one of the list (a new one being typed).
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
