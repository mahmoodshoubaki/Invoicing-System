import { AlarmClock, Moon } from 'lucide-react';

import Card from '@/components/common/Card';
import ProjectLink from '@/components/workflow/ProjectLink';
import TargetLinks from '@/components/workflow/TargetLinks';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { INSTANCE_STATUS_COLORS, INSTANCE_STATUS_LABELS } from '@/constants/workflow';

function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>
        {label}
      </p>
      <div className="mt-0.5 text-xs" style={{ color: CHROME.textPrimary }}>{children}</div>
    </div>
  );
}

/**
 * The run at a glance: its status, where it stands, what it is about, and any
 * clock running on it.
 *
 * @param {{ run: Object, targetTypeKey: number|null }} props
 */
export default function RunFacts({ run, targetTypeKey }) {
  const color = INSTANCE_STATUS_COLORS[run.statusKey] ?? CHROME.textMuted;

  return (
    <Card className="mb-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Fact label="Status">
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: withAlpha(color, 0.12), color }}
          >
            {INSTANCE_STATUS_LABELS[run.statusKey] ?? run.status}
          </span>
        </Fact>

        <Fact label="Stage">
          {run.currentStageTitle ?? run.currentStageId ?? '—'}
          {run.currentStepId && (
            <span className="ml-1 font-mono text-[11px]" style={{ color: CHROME.textMuted }}>
              · {run.currentStepId}
            </span>
          )}
        </Fact>

        <Fact label="About">
          {/* The records the run is about, then the project they belong to —
              what it is working on, and where that sits. */}
          <div className="mt-1 flex flex-col gap-1">
            <TargetLinks
              targetTypeKey={targetTypeKey}
              targetIds={run.targetIds}
              projectCode={run.projectCode}
              size="xs"
            />
            {run.projectCode && <ProjectLink projectCode={run.projectCode} size="xs" />}
            {!run.projectCode && run.targetIds.length === 0 && (
              <span style={{ color: CHROME.textMuted }}>nothing — this workflow tracks no records</span>
            )}
          </div>
        </Fact>

        <Fact label="Clocks">
          {run.delayUntil || run.stageDeadlineOn ? (
            <span className="flex flex-col gap-0.5">
              {run.delayUntil && (
                <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: CHROME.textMuted }}>
                  <Moon size={10} aria-hidden="true" />
                  asleep until {formatDateTime(run.delayUntil)}
                </span>
              )}
              {run.stageDeadlineOn && (
                <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: STATUS.warning }}>
                  <AlarmClock size={10} aria-hidden="true" />
                  escalates {formatDateTime(run.stageDeadlineOn)}
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: CHROME.textMuted }}>none running</span>
          )}
        </Fact>
      </div>
    </Card>
  );
}
