'use client';

import { AlertTriangle } from 'lucide-react';

import { listOf } from '@/lib/projectReadiness';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * @param {{ missing: string[], failed?: boolean }} props  failed: the project's details could not be read
 */
export default function ProjectNotReady({ missing, failed = false }) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3"
      style={{ borderColor: withAlpha(STATUS.critical, 0.25), backgroundColor: withAlpha(STATUS.critical, 0.05) }}
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: STATUS.critical }} aria-hidden="true" />
      <div className="text-sm" style={{ color: CHROME.textPrimary }}>
        <p className="font-semibold">No request can be submitted for this project yet.</p>
        {failed ? (
          <p className="mt-0.5 text-xs" style={{ color: CHROME.textSecondary }}>
            Its details could not be checked. Try again in a moment.
          </p>
        ) : missing.length > 0 && (
          <p className="mt-0.5 text-xs" style={{ color: CHROME.textSecondary }}>
            It has no {listOf(missing)} in EPM. Once they are filled in there, requests can be submitted.
          </p>
        )}
      </div>
    </div>
  );
}
