'use client';

import { memo, useMemo, useState } from 'react';
import { Code2, SlidersHorizontal } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import {
  CRON_FREQUENCY,
  WEEKDAYS,
  buildCron,
  describeCron,
  looksLikeCron,
  parseCron,
} from '@/utils/cron';

const FREQUENCY_OPTIONS = [
  { value: CRON_FREQUENCY.DAILY, label: 'Every day' },
  { value: CRON_FREQUENCY.WORKING_DAYS, label: 'Every working day (Sun–Thu)' },
  { value: CRON_FREQUENCY.WEEKLY, label: 'Every week on…' },
  { value: CRON_FREQUENCY.MONTHLY, label: 'Every month on…' },
];

const inputClass =
  'rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-primary';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

/**
 * A schedule, expressed either way.
 *
 * Cron is precise and unreadable; a form is readable and cannot express
 * everything. So both are offered, over one value: the form writes the
 * expression, and the expression is read back into the form whenever it
 * matches a shape the form can represent. Nothing is stored but the cron
 * string itself, so the two views can never disagree.
 *
 * Month days stop at 28 deliberately — "the 31st of every month" silently does
 * nothing in February, and a scheduler that skips months is a worse outcome
 * than a picker that will not offer the option.
 */
function CronField({ value, onChange }) {
  const parsed = useMemo(() => parseCron(value), [value]);
  const description = useMemo(() => describeCron(value), [value]);

  // Anything the form cannot represent opens in raw mode, so an author who
  // wrote an unusual expression is never dropped into a form that would
  // silently rewrite it.
  const [mode, setMode] = useState(
    parsed.frequency === CRON_FREQUENCY.CUSTOM && value ? 'raw' : 'form'
  );

  const update = (patch) => onChange(buildCron({ ...parsed, ...patch }));

  const invalid = Boolean(value) && !looksLikeCron(value);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: CHROME.textSecondary }}>
          Schedule
        </span>
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'form' ? 'raw' : 'form'))}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
          style={{ color: CHROME.textMuted }}
        >
          {mode === 'form' ? <Code2 size={11} aria-hidden="true" /> : <SlidersHorizontal size={11} aria-hidden="true" />}
          {mode === 'form' ? 'Write cron' : 'Use the picker'}
        </button>
      </div>

      {mode === 'form' ? (
        <div className="flex flex-col gap-2">
          <select
            value={parsed.frequency === CRON_FREQUENCY.CUSTOM ? CRON_FREQUENCY.DAILY : parsed.frequency}
            onChange={(e) => update({ frequency: e.target.value })}
            aria-label="How often"
            className={`${inputClass} w-full`}
          >
            {FREQUENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-2">
            {parsed.frequency === CRON_FREQUENCY.WEEKLY && (
              <select
                value={parsed.weekday}
                onChange={(e) => update({ weekday: Number(e.target.value) })}
                aria-label="Day of the week"
                className={inputClass}
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            )}

            {parsed.frequency === CRON_FREQUENCY.MONTHLY && (
              <select
                value={parsed.monthDay}
                onChange={(e) => update({ monthDay: Number(e.target.value) })}
                aria-label="Day of the month"
                className={inputClass}
              >
                {MONTH_DAYS.map((d) => (
                  <option key={d} value={d}>Day {d}</option>
                ))}
              </select>
            )}

            <span className="text-xs" style={{ color: CHROME.textMuted }}>at</span>

            <select
              value={parsed.hour}
              onChange={(e) => update({ hour: Number(e.target.value) })}
              aria-label="Hour"
              className={inputClass}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
              ))}
            </select>

            <span className="text-xs" style={{ color: CHROME.textMuted }}>:</span>

            <select
              value={parsed.minute}
              onChange={(e) => update({ minute: Number(e.target.value) })}
              aria-label="Minute"
              className={inputClass}
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0 9 * * 1"
          aria-label="Cron expression"
          className={`${inputClass} w-full font-mono`}
          style={invalid ? { borderColor: STATUS.critical } : undefined}
        />
      )}

      <p
        className="mt-1.5 text-[11px]"
        style={{ color: invalid ? STATUS.critical : CHROME.textMuted }}
      >
        {invalid
          ? 'That is not five cron fields — minute, hour, day of month, month, day of week.'
          : description
            ? `${description} · ${value}`
            : value
              ? `Runs on: ${value}`
              : 'Pick how often this should run.'}
      </p>
    </div>
  );
}

export default memo(CronField);
