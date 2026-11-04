'use client';

import { Filter } from 'lucide-react';

import { controlClass } from '@/components/ui/kit';
import { CHROME } from '@/theme/vizPalette';

/**
 * The project status a list keeps to. A value from the address shows even
 * before the status list has loaded.
 *
 * @param {{ value: string, onChange: (value: string) => void, statuses: string[] }} props
 */
export default function ProjectStatusSelect({ value, onChange, statuses }) {
  const options = value && !statuses.includes(value) ? [value, ...statuses] : statuses;
  return (
    <span className="flex items-center gap-2">
      <Filter size={13} style={{ color: CHROME.textMuted }} aria-hidden="true" />
      <select aria-label="Project status" value={value} onChange={(e) => onChange(e.target.value)} className={controlClass}>
        <option value="">Every project status</option>
        {options.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </span>
  );
}
