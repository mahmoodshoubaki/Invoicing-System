'use client';

import { useSelector } from 'react-redux';

import { selectChangeRequestReasonsMap } from '@/store/slices/lookupsSlice';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';

function Count({ value, label }) {
  return (
    <div className="rounded-xl bg-[#f6f5f3] px-3 py-2">
      <p className="text-lg font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>{value}</p>
      <p className="text-[11px]" style={{ color: CHROME.textMuted }}>{label}</p>
    </div>
  );
}

/**
 * What a reviewer reads first (2026-10-19): what the request touches, how much
 * of it, who raised it and when, why — each reason with its fixed justification
 * — and the requester's own words.
 *
 * @param {{ changeRequest: Object }} props
 */
export default function ChangeRequestOverview({ changeRequest: cr }) {
  const reasonsMap = useSelector(selectChangeRequestReasonsMap);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5">
      <p className="mb-2 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>Change Request Overview</p>
      <div className="flex flex-wrap gap-1.5">
        {cr.summary.affectedAreas.map((area) => (
          <span key={area} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: withAlpha(STATUS.info, 0.1), color: STATUS.info }}>
            {area}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Count value={cr.summary.changedItemCount} label="items changed" />
        <Count value={cr.summary.changedProjectFieldCount} label="project fields changed" />
        <Count value={cr.summary.changedCycleCount} label="plan cycles changed" />
      </div>
      <p className="text-xs" style={{ color: CHROME.textMuted }}>
        Raised by <strong style={{ color: CHROME.textPrimary }}>{cr.requestedByName ?? 'someone'}</strong>
        {cr.createdOn && ` on ${formatDateTime(cr.createdOn)}`}
      </p>

      <div>
        <p className="mb-1.5 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Reasons</p>
        <ul className="flex flex-col gap-2">
          {cr.reasons.map((reason) => (
            <li key={reason.key} className="rounded-lg border border-[#f1f0ee] px-3 py-2">
              <p className="text-sm font-medium" style={{ color: CHROME.textPrimary }}>{reason.label}</p>
              {reasonsMap[reason.key]?.justification && (
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: CHROME.textMuted }}>{reasonsMap[reason.key].justification}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {cr.additionalDetails && (
        <div>
          <p className="mb-1 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Additional details</p>
          <p className="whitespace-pre-line text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>{cr.additionalDetails}</p>
        </div>
      )}
    </div>
  );
}
