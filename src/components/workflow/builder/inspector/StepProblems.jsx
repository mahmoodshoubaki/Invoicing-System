'use client';

import { AlertTriangle } from 'lucide-react';

import { STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

export default function StepProblems({ errors, label = 'Problems with this step' }) {
  if (errors.length === 0) return null;

  return (
    <ul
      className="flex flex-col gap-1 rounded-lg px-2.5 py-2"
      style={{ backgroundColor: withAlpha(STATUS.critical, 0.07) }}
      aria-label={label}
    >
      {errors.map((error, index) => (
        <li key={index} className="flex items-start gap-1.5 text-[11px]" style={{ color: STATUS.critical }}>
          <AlertTriangle size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error.replace('This step: ', '').replace('This step ', '')}
        </li>
      ))}
    </ul>
  );
}
