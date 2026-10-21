'use client';

import { STATUS } from '@/theme/vizPalette';

/**
 * An on/off switch — a real checkbox underneath, so it is clicked, tabbed to
 * and read out like one.
 *
 * @param {{ checked: boolean, onChange: (checked: boolean) => void, disabled?: boolean, label: string, title?: string }} props
 */
export default function Switch({ checked, onChange, disabled = false, label, title }) {
  return (
    <label
      className={`relative inline-flex h-5 w-9 shrink-0 items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      title={title}
    >
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className="absolute inset-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1"
        style={{ backgroundColor: checked ? STATUS.good : '#d9d6cf' }}
        aria-hidden="true"
      />
      <span
        className={`absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`}
        aria-hidden="true"
      />
    </label>
  );
}
