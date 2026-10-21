'use client';

import { CHROME } from '@/theme/vizPalette';

/**
 * A stage's or step's name, at the top of its panel.
 *
 * Typing changes the title only; the id follows it when the box is left
 * (`onCommit`), because re-deriving an id per keystroke remounted whatever was
 * being typed into. The panel follows the item through that change of id.
 *
 * @param {{ value: string, placeholder: string, label: string, onChange: (v: string) => void, onCommit: () => void }} props
 */
export default function TitleInput({ value, placeholder, label, onChange, onCommit }) {
  return (
    <input
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      placeholder={placeholder}
      aria-label={label}
      className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 -ml-1 text-sm font-semibold outline-none transition-colors hover:border-[#e6e4dd] focus:border-primary"
      style={{ color: CHROME.textPrimary }}
    />
  );
}
