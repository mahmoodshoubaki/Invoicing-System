'use client';

/** A repeat's count or stop condition — edited in the side panel. The steps it repeats stay on the canvas (RepeatBody). */

import { memo } from 'react';

import ConditionBuilder from '@/components/workflow/builder/conditions/ConditionBuilder';
import { createFilterGroup } from '@/models/workflow';
import { CHROME } from '@/theme/vizPalette';

import { controlClass, Label } from './shared';

/** Counted, or until a condition holds. */
export const RepeatEditor = memo(function RepeatEditor({ step, fields, onChange }) {
  const counted = step.times != null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {[
          { counted: true, label: 'A set number of times' },
          { counted: false, label: 'Until something is true' },
        ].map((option) => (
          <button
            key={String(option.counted)}
            type="button"
            onClick={() =>
              // Only one arm is ever sent: switching drops the other's fields
              // rather than leaving a stale `until` beside a `times`.
              onChange(
                option.counted
                  ? { times: 3, until: undefined, maxIterations: undefined }
                  : { times: undefined, until: createFilterGroup(), maxIterations: 10 }
              )
            }
            aria-pressed={counted === option.counted}
            className="rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors"
            style={{
              borderColor: counted === option.counted ? CHROME.textPrimary : '#f1f0ee',
              backgroundColor: counted === option.counted ? '#fbfaf9' : 'transparent',
              color: CHROME.textPrimary,
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {counted ? (
        <div className="w-32">
          <Label>Times</Label>
          <input
            type="number"
            min={1}
            value={step.times ?? 1}
            onChange={(e) => onChange({ times: Number(e.target.value) || 1 })}
            className={`${controlClass} w-full`}
          />
        </div>
      ) : (
        <>
          <div>
            <Label hint="— checked before each pass">Stop when</Label>
            <ConditionBuilder
              value={step.until ?? createFilterGroup()}
              onChange={(until) => onChange({ until })}
              fields={fields}
            />
          </div>
          <div className="w-40">
            <Label hint="— so a condition that never comes true cannot loop forever">Stop after at most</Label>
            <input
              type="number"
              min={1}
              value={step.maxIterations ?? 10}
              onChange={(e) => onChange({ maxIterations: Number(e.target.value) || 1 })}
              className={`${controlClass} w-full`}
            />
          </div>
        </>
      )}
    </div>
  );
});
