'use client';

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { ccDeliveryProblems } from '@/lib/workflowBuilder/validation/steps/sendNotification';

/**
 * What the people copied in get (2026-10-08): the email, with them on its CC
 * line, and/or an in-app notification of their own. Email starts ticked —
 * and a step saved before the boxes existed behaves as if it were.
 *
 * @param {{ step: Object, onChange: (patch: Object) => void }} props
 */
function CcDelivery({ step, onChange }) {
  const email = step.ccGetsEmail !== false;
  const inApp = step.ccGetsInApp === true;
  const problems = ccDeliveryProblems(step);

  return (
    <div className="rounded-lg border border-[#f1f0ee] bg-[#fbfaf9] p-2.5">
      <p className="text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>What the people copied in get</p>
      <div className="mt-1.5 flex flex-col gap-1">
        <label className="flex items-start gap-1.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
          <input
            type="checkbox"
            className="mt-0.5"
            checked={email}
            onChange={(e) => onChange({ ccGetsEmail: e.target.checked })}
          />
          <span>
            Email
            <span className="ml-1" style={{ color: CHROME.textMuted }}>— the same email, with them on its CC line</span>
          </span>
        </label>
        <label className="flex items-start gap-1.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
          <input
            type="checkbox"
            className="mt-0.5"
            checked={inApp}
            onChange={(e) => onChange({ ccGetsInApp: e.target.checked })}
          />
          <span>
            In-app
            <span className="ml-1" style={{ color: CHROME.textMuted }}>— a notification of their own (people only, not addresses)</span>
          </span>
        </label>
      </div>

      {problems.map((problem) => (
        <p
          key={problem}
          className="mt-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px]"
          style={{ backgroundColor: withAlpha(STATUS.critical, 0.08), color: STATUS.critical }}
        >
          <AlertTriangle size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
          This step {problem}
        </p>
      ))}
    </div>
  );
}

export default memo(CcDelivery);
