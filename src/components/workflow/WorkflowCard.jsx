'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { CalendarClock, CircleDot, GitBranch, History, Pencil, Play, Target, Zap } from 'lucide-react';

import { revealItem } from '@/components/motion/Reveal';
import { formatDate } from '@/utils/formatters';
import { withAlpha } from '@/utils/color';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { TARGET_TYPE_LABELS, TRIGGER_TYPE_LABELS, TRIGGER_TYPE, canStartByHand } from '@/constants/workflow';
import { ROUTES } from '@/constants/routes';

const TRIGGER_ICONS = {
  [TRIGGER_TYPE.EVENT]: Zap,
  [TRIGGER_TYPE.SCHEDULE]: CalendarClock,
  [TRIGGER_TYPE.MANUAL]: CircleDot,
};

function Meta({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: CHROME.textMuted }}>
      <Icon size={12} aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * One workflow on the definitions list — a workflow, not a version.
 *
 * The publish state is the thing this card exists to communicate, and it has
 * three cases rather than two: never published, published and current, or
 * published with newer versions sitting behind it. That last one is the
 * interesting one — somebody saved changes that are not live — and it is
 * invisible if you only show "active v2".
 */
function WorkflowCard({ workflow, canManage, canRun, onOpenVersions, onStart }) {
  const TriggerIcon = TRIGGER_ICONS[workflow.triggerTypeKey] ?? GitBranch;

  // Since drafts (2026-10-11) a workflow is live, has a draft, both, or — only
  // ever saved — a draft and nothing else.
  const publishState = !workflow.isPublished
    ? workflow.hasDraft
      ? { label: 'Draft — not published', color: STATUS.warning, tint: withAlpha(STATUS.warning, 0.12) }
      : { label: 'Not published', color: CHROME.textMuted, tint: '#f1f0ee' }
    : workflow.hasDraft
      ? { label: `Live v${workflow.activeVersion} · draft`, color: STATUS.warning, tint: withAlpha(STATUS.warning, 0.12) }
      : { label: `Live v${workflow.activeVersion}`, color: STATUS.good, tint: withAlpha(STATUS.good, 0.12) };
  const versionCount = workflow.latestVersion ?? 0;
  const versionsLabel = versionCount === 0
    ? 'Draft only'
    : `${versionCount} ${versionCount === 1 ? 'version' : 'versions'}${workflow.hasDraft ? ' + draft' : ''}`;

  return (
    <motion.div variants={revealItem} className="h-full">
      <div className="flex h-full flex-col rounded-xl border border-[#f1f0ee] bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
              {workflow.name}
            </h3>
            <p className="mt-0.5 font-mono text-xs" style={{ color: CHROME.textMuted }}>
              {workflow.code}
            </p>
          </div>

          <span
            className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: publishState.tint, color: publishState.color }}
          >
            {publishState.label}
          </span>
        </div>

        {workflow.description && (
          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
            {workflow.description}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <Meta icon={TriggerIcon}>{TRIGGER_TYPE_LABELS[workflow.triggerTypeKey] ?? 'Unknown trigger'}</Meta>
          <Meta icon={Target}>{TARGET_TYPE_LABELS[workflow.targetTypeKey] ?? 'Unknown target'}</Meta>
          {workflow.updatedOn && <Meta icon={History}>Updated {formatDate(workflow.updatedOn)}</Meta>}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-[#f1f0ee] pt-3.5">
          <button
            type="button"
            onClick={() => onOpenVersions(workflow)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[#f6f5f3]"
            style={{ color: CHROME.textSecondary }}
          >
            <History size={13} aria-hidden="true" />
            {versionsLabel}
          </button>

          {/* Only a published workflow can be started — an unpublished one has
              no live version for a run to follow — and not one on a schedule,
              whose own scan picks its records (WF-021). */}
          {canRun && workflow.isPublished && canStartByHand(workflow.triggerTypeKey) && (
            <button
              type="button"
              onClick={() => onStart(workflow)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[#f6f5f3]"
              style={{ color: CHROME.textSecondary }}
            >
              <Play size={13} aria-hidden="true" />
              Start a run
            </button>
          )}

          {canManage && (
            <Link
              href={`${ROUTES.WORKFLOW_BUILDER}?code=${encodeURIComponent(workflow.code)}`}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[#f6f5f3]"
              style={{ color: CHROME.textSecondary }}
            >
              <Pencil size={13} aria-hidden="true" />
              Open in builder
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default memo(WorkflowCard);
