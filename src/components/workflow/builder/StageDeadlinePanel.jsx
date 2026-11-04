'use client';

import { memo } from 'react';
import { AlarmClock } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';
import { createStageDeadline } from '@/models/workflow';
import DurationFields from './DurationFields';

const controlClass =
  'rounded-md border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-primary';

function StageDeadlinePanel({ stage, stages, onChange }) {
  const deadline = stage.deadline;
  const enabled = Boolean(deadline);

  const patch = (changes) => onChange({ ...deadline, ...changes });

  return (
    <div className="rounded-lg border border-[#f1f0ee] bg-[#fbfaf9] p-2.5">
      <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: CHROME.textSecondary }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? createStageDeadline({ afterDays: 2, toStageId: stages.find((s) => s.id !== stage.id)?.id ?? stage.id })
                : null
            )
          }
        />
        <AlarmClock size={13} aria-hidden="true" />
        If nobody acts in time
      </label>

      {enabled && (
        <div className="mt-2.5 flex flex-col gap-2.5">
          {/* Same five units and day exclusions as a delay, spelled `after…`. */}
          <DurationFields source={deadline} prefix="after" onChange={patch} />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px]" style={{ color: CHROME.textMuted }}>then go to</span>
            <div className="min-w-40 flex-1">
              <select
                value={deadline.toStageId ?? ''}
                onChange={(e) => patch({ toStageId: e.target.value })}
                aria-label="Deadline target stage"
                className={`${controlClass} w-full`}
              >
                <option value="">Choose a stage…</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title || s.id}
                    {/* Legal here, and only here. */}
                    {s.id === stage.id ? ' — start this stage over' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[11px] leading-snug" style={{ color: CHROME.textMuted }}>
            When this fires, the pending to-dos in this stage are cancelled and the run moves on. It
            is armed on entry and dropped on exit, so normally it never fires at all.
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(StageDeadlinePanel);
