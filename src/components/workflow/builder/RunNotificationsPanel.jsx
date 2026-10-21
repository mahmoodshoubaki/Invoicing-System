'use client';

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { withPlaceholderValues } from '@/lib/notificationPlaceholders';
import {
  RUN_NOTIFICATION_ENTRIES,
  defaultRunNotifications,
  effectiveRunNotifications,
} from '@/lib/workflowNotifications';
import NotificationChoice from './notifications/NotificationChoice';
import { runNotificationTokens } from './notifications/notificationTokens';

/**
 * Who hears about a run going wrong (2026-10-07) — the workflow's Notifications tab.
 *
 * All three go to the workflow ADMINS — everybody holding Workflows.Manage —
 * never to the people doing the tasks, and whoever pressed Pause or Resume is
 * left out. No block at all (every workflow saved before this) means all three
 * on; the first change writes the block out. Each picked type takes values for
 * its words (2026-10-08).
 *
 * @param {{ graph: Object, types: Array|null, fields: Array, onChange: (notifications: Object) => void }} props
 */
function RunNotificationsPanel({ graph, types, fields, onChange }) {
  const block = effectiveRunNotifications(graph);
  const write = (changes) => onChange({ ...(graph?.notifications ?? defaultRunNotifications()), ...changes });

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <p className="text-xs font-medium" style={{ color: CHROME.textSecondary }}>Tell the workflow admins when</p>
        <p className="mt-0.5 text-[11px]" style={{ color: CHROME.textMuted }}>
          Everyone who can manage workflows. Not the people doing its tasks, and never whoever paused or resumed it.
        </p>
      </div>

      {RUN_NOTIFICATION_ENTRIES.map((entry) => {
        const value = block[entry.key];
        return (
          <NotificationChoice
            key={entry.key}
            label={entry.label}
            entry={value}
            standardType={entry.standardType}
            types={types}
            tokens={runNotificationTokens(fields, entry)}
            onToggle={(on) => write({ [entry.key]: on ? { typeKey: entry.standardType } : null })}
            onTypeKey={(typeKey) => write({ [entry.key]: typeKey == null ? null : { ...value, typeKey } })}
            onValues={(values) => write({ [entry.key]: withPlaceholderValues(value, values) })}
          />
        );
      })}

      {/* The one that matters most: nothing else tells anybody a run has stopped. */}
      {!block.failed && (
        <p
          className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
          style={{ backgroundColor: withAlpha(STATUS.warning, 0.12), color: CHROME.textSecondary }}
        >
          <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
          With this off, nobody hears about a run that stops with an error. It waits, faulted, until somebody
          happens to look at the monitoring page.
        </p>
      )}
    </div>
  );
}

export default memo(RunNotificationsPanel);
