'use client';

import { memo } from 'react';
import { Info } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import {
  DURATION_UNITS,
  EXCLUDE_DAYS_HELP,
  WEEKDAY_LABELS,
  WEEKDAY_NAMES,
  WEEKEND_DAYS,
} from '@/constants/workflow';
import { describeDuration, durationPatch, isDurationEmpty, readDuration } from '@/utils/workflowDuration';

const numberClass =
  'w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-primary';

/**
 * @param {{source: Object, prefix: 'delay'|'after', onChange: Function}} props
 */
function DurationFields({ source, prefix, onChange, optional = false }) {
  const values = readDuration(source, prefix);
  const excluded = values.excludeDays ?? [];

  const apply = (next) => onChange(durationPatch({ ...values, ...next }, prefix));

  const setUnit = (key, raw) => {
    const n = raw === '' ? 0 : Number(raw);
    apply({ [key]: Number.isNaN(n) ? 0 : n });
  };

  const toggleDay = (day) =>
    apply({
      excludeDays: excluded.includes(day) ? excluded.filter((d) => d !== day) : [...excluded, day],
    });

  const weekendOn = WEEKEND_DAYS.every((d) => excluded.includes(d));
  const toggleWeekend = () =>
    apply({
      excludeDays: weekendOn
        ? excluded.filter((d) => !WEEKEND_DAYS.includes(d))
        : [...new Set([...excluded, ...WEEKEND_DAYS])],
    });

  const summary = describeDuration(source, prefix);
  const allExcluded = excluded.length === WEEKDAY_NAMES.length;
  const negative = DURATION_UNITS.some((u) => Number(values[u.key]) < 0);
  const ok = !negative && !allExcluded && (Boolean(summary) || optional);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-5 gap-1.5">
        {DURATION_UNITS.map((unit) => (
          <div key={unit.key}>
            <label
              htmlFor={`${prefix}-${unit.key}`}
              className="mb-1 block text-[11px]"
              style={{ color: CHROME.textMuted }}
            >
              {unit.label}
            </label>
            <input
              id={`${prefix}-${unit.key}`}
              type="number"
              min={0}
              value={values[unit.key] || ''}
              onChange={(e) => setUnit(unit.key, e.target.value)}
              placeholder="0"
              className={numberClass}
              style={Number(values[unit.key]) < 0 ? { borderColor: STATUS.critical } : undefined}
            />
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
            Skip these days
          </span>
          <button
            type="button"
            onClick={toggleWeekend}
            className="rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
            style={{ color: CHROME.textMuted }}
          >
            {weekendOn ? 'Clear weekend' : 'Skip weekends (Fri–Sat)'}
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {WEEKDAY_NAMES.map((day) => {
            const on = excluded.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={on}
                className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor: on ? withAlpha(STATUS.warning, 0.16) : '#f6f5f3',
                  color: on ? STATUS.warning : CHROME.textMuted,
                  border: `1px solid ${on ? withAlpha(STATUS.warning, 0.4) : 'transparent'}`,
                }}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            );
          })}
        </div>
      </div>

      {excluded.length > 0 && !allExcluded && (
        <p
          className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
          style={{ backgroundColor: '#fbfaf9', color: CHROME.textMuted }}
        >
          <Info size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
          {EXCLUDE_DAYS_HELP}
        </p>
      )}

      <p
        className="rounded-md px-2 py-1.5 text-[11px] leading-snug"
        style={{
          backgroundColor: ok ? '#ffffff' : withAlpha(STATUS.critical, 0.08),
          color: ok ? CHROME.textMuted : STATUS.critical,
        }}
      >
        {negative
          ? 'A duration cannot be negative.'
          : allExcluded
            ? 'Every day is excluded, so this would never come due.'
            : isDurationEmpty(values)
              ? 'Set at least one unit — a duration of zero is refused.'
              : `Waits ${summary}.`}
      </p>
    </div>
  );
}

export default memo(DurationFields);
