'use client';

/** A parallel step's settings — edited in the side panel. Its branches stay on the canvas (ParallelBranches). */

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

import ConditionBuilder from '@/components/workflow/builder/conditions/ConditionBuilder';
import { createFilterGroup } from '@/models/workflow';
import { CHROME, STATUS } from '@/theme/vizPalette';

import { Note } from './shared';

/** Branches that all run at the same time — and when to stop waiting for the rest. */
export const ParallelEditor = memo(function ParallelEditor({ step, fields, onChange }) {
  const joinWhenSet = step.joinWhen != null;
  const count = (step.branches ?? []).length;

  return (
    <div className="flex flex-col gap-3">
      <Note>
        What runs at the same time is the <strong>waiting</strong>: everyone is asked at once and
        nobody blocks anybody else. The engine still walks the branches one after another inside a
        single call — nothing runs on two threads.
      </Note>

      <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
        {count} branch{count === 1 ? '' : 'es'}. Name, add and reorder them on the canvas.
      </p>

      <div className="border-t border-[#f1f0ee] pt-3">
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
          <input
            type="checkbox"
            checked={joinWhenSet}
            onChange={(e) => onChange({ joinWhen: e.target.checked ? createFilterGroup() : null })}
          />
          Stop early when…
        </label>

        {joinWhenSet ? (
          <>
            <ConditionBuilder
              value={step.joinWhen}
              onChange={(joinWhen) => onChange({ joinWhen })}
              fields={fields}
            />
            <Note tone={STATUS.warning} icon={AlertTriangle}>
              When this holds, everything still open inside the block is cancelled — the other
              branches&rsquo; to-dos disappear from their owners&rsquo; lists.
            </Note>
          </>
        ) : (
          <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
            Without this, the step waits for every branch to finish.
          </p>
        )}
      </div>
    </div>
  );
});
