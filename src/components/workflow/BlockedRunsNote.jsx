'use client';

import Link from 'next/link';
import { AlertTriangle, ExternalLink } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { ROUTES } from '@/constants/routes';

/**
 * Why going live was refused (409 WF-024): runs are waiting in a stage that
 * changed, and moving them would strand them. Each links to its run, because
 * the way forward is there — finish or cancel it — or in the builder: publish a
 * version that leaves that stage alone.
 *
 * @param {{ runs: Array<{ instanceId: string, stageId: string|null, stageTitle: string|null }> }} props
 */
export default function BlockedRunsNote({ runs }) {
  if (!runs?.length) return null;

  return (
    <div className="mt-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: withAlpha(STATUS.critical, 0.07) }}>
      <p className="flex items-start gap-1.5 text-xs font-semibold" style={{ color: STATUS.critical }}>
        <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden="true" />
        Refused — {runs.length} run{runs.length === 1 ? ' is' : 's are'} waiting in a stage that changed
      </p>
      <ul className="mt-1.5 flex flex-col gap-0.5 pl-5">
        {runs.map((run) => (
          <li key={run.instanceId} className="text-xs" style={{ color: CHROME.textSecondary }}>
            <Link
              href={ROUTES.MONITORING_RUN(run.instanceId)}
              className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
              style={{ color: STATUS.info }}
            >
              Run {String(run.instanceId).slice(0, 8)} <ExternalLink size={10} aria-hidden="true" />
            </Link>
            {' — in '}
            {run.stageTitle || run.stageId || 'a stage'}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 pl-5 text-[11px] leading-relaxed" style={{ color: CHROME.textSecondary }}>
        Nothing went live and nothing moved. Finish or cancel those runs, or publish a version that leaves that stage
        alone. Changing a task&rsquo;s fields never blocks this.
      </p>
    </div>
  );
}
