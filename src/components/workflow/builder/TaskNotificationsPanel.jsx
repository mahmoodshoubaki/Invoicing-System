'use client';

import { memo } from 'react';

import { CHROME } from '@/theme/vizPalette';
import { isDurationEmpty, readDuration } from '@/utils/workflowDuration';
import { withPlaceholderValues } from '@/lib/notificationPlaceholders';
import {
  DEFAULT_REMINDER,
  REMINDER_ENTRY,
  TASK_NOTIFICATION_ENTRIES,
  defaultTaskNotifications,
  effectiveTaskNotifications,
} from '@/lib/workflowNotifications';
import NotificationChoice from './notifications/NotificationChoice';
import ReminderTiming from './notifications/ReminderTiming';
import { taskNotificationTokens } from './notifications/notificationTokens';

/**
 * Who a human task tells, and when (2026-10-07) — the task's Notifications tab.
 *
 * A step saved before this has no block, which the engine reads as the four
 * standard notifications on and no reminder — so that is what is shown, and
 * the first change writes the whole block out before applying it. From then
 * on an unticked box means "send nothing".
 *
 * Every picked type takes values for its words (2026-10-08). They can use the
 * run's variables and the task's own details, but not the record's fields —
 * a task's notifications are not sent with them.
 *
 * @param {{ step: Object, types: Array|null, fields: Array, onChange: (patch: Object) => void }} props
 */
function TaskNotificationsPanel({ step, types, fields, onChange }) {
  const block = effectiveTaskNotifications(step);

  const write = (changes) =>
    onChange({ notifications: { ...(step.notifications ?? defaultTaskNotifications()), ...changes } });

  const reminder = block.reminder;
  const hasDueDate = !isDurationEmpty(readDuration(step, 'dueIn'));
  const setReminder = (changes) => write({ reminder: { ...reminder, ...changes } });

  const reminderProblem = !reminder
    ? null
    : !hasDueDate
      ? 'A reminder counts back from the due date, so this task needs one (Due in, on the Task tab).'
      : reminder.repeat && (reminder.repeatEveryDays || 0) + (reminder.repeatEveryHours || 0) <= 0
        ? 'A repeating reminder needs a period above zero.'
        : null;

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
        Who hears about this task, and with which notification. Untick one to send nothing for it.
      </p>

      {TASK_NOTIFICATION_ENTRIES.map((entry) => {
        const value = block[entry.key];
        return (
          <NotificationChoice
            key={entry.key}
            label={entry.label}
            who={entry.who}
            entry={value}
            standardType={entry.standardType}
            types={types}
            tokens={taskNotificationTokens(fields, entry)}
            onToggle={(on) => write({ [entry.key]: on ? { typeKey: entry.standardType } : null })}
            onTypeKey={(typeKey) => write({ [entry.key]: typeKey == null ? null : { ...value, typeKey } })}
            onValues={(values) => write({ [entry.key]: withPlaceholderValues(value, values) })}
          />
        );
      })}

      {/* The reminder: off until ticked, because it needs a due date and a period. */}
      <div className="border-t border-[#f1f0ee] pt-3">
        <NotificationChoice
          label={REMINDER_ENTRY.label}
          who={REMINDER_ENTRY.who}
          entry={reminder}
          standardType={REMINDER_ENTRY.standardType}
          types={types}
          tokens={taskNotificationTokens(fields, REMINDER_ENTRY)}
          onToggle={(on) => write({ reminder: on ? { ...DEFAULT_REMINDER } : null })}
          // A reminder always has a type: clearing the dropdown changes nothing.
          onTypeKey={(typeKey) => typeKey != null && setReminder({ typeKey })}
          onValues={(values) => write({ reminder: withPlaceholderValues(reminder, values) })}
        >
          {reminder && <ReminderTiming reminder={reminder} problem={reminderProblem} onChange={setReminder} />}
        </NotificationChoice>
      </div>
    </div>
  );
}

export default memo(TaskNotificationsPanel);
