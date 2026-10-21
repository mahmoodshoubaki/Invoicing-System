'use client';

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

const numberClass =
  'w-14 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs tabular-nums outline-none focus:border-primary';

const whole = (value) => Math.max(0, Number(value) || 0);

/**
 * When a task's reminder goes out: so long before the due date, and optionally
 * again every so often until the task is answered.
 *
 * @param {{ reminder: Object, problem: string|null, onChange: (patch: Object) => void }} props
 */
function ReminderTiming({ reminder, problem, onChange }) {
  return (
    <div className="flex flex-col gap-1.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="number"
          min={0}
          value={reminder.beforeDueDays ?? 0}
          onChange={(e) => onChange({ beforeDueDays: whole(e.target.value) })}
          aria-label="Days before the due date"
          className={numberClass}
        />
        days
        <input
          type="number"
          min={0}
          max={23}
          value={reminder.beforeDueHours ?? 0}
          onChange={(e) => onChange({ beforeDueHours: whole(e.target.value) })}
          aria-label="Hours before the due date"
          className={numberClass}
        />
        hours before it is due
      </div>

      <label className="flex flex-wrap items-center gap-1.5">
        <input
          type="checkbox"
          checked={reminder.repeat === true}
          onChange={(e) => onChange({ repeat: e.target.checked })}
        />
        and again every
        <input
          type="number"
          min={0}
          value={reminder.repeatEveryDays ?? 0}
          onChange={(e) => onChange({ repeatEveryDays: whole(e.target.value) })}
          disabled={!reminder.repeat}
          aria-label="Repeat every so many days"
          className={numberClass}
        />
        days
        <input
          type="number"
          min={0}
          max={23}
          value={reminder.repeatEveryHours ?? 0}
          onChange={(e) => onChange({ repeatEveryHours: whole(e.target.value) })}
          disabled={!reminder.repeat}
          aria-label="Repeat every so many hours"
          className={numberClass}
        />
        hours until it is answered
      </label>

      <p style={{ color: CHROME.textMuted }}>
        Counted on the plain clock from the due date — weekends included. It stops once the task is answered,
        handed over or cancelled.
      </p>

      {problem && (
        <p
          className="flex items-start gap-1.5 rounded-md px-2 py-1.5"
          style={{ backgroundColor: withAlpha(STATUS.critical, 0.08), color: STATUS.critical }}
        >
          <AlertTriangle size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
          {problem}
        </p>
      )}
    </div>
  );
}

export default memo(ReminderTiming);
