'use client';

import Link from 'next/link';
import { ExternalLink, FileDiff, FileText, FolderKanban, LayoutList } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { ROUTES } from '@/constants/routes';
import { TARGET_TYPE, TARGET_TYPE_LABELS } from '@/constants/workflow';

/** How a target id reads when there is no name to show: the first block of a guid. */
function shortId(id) {
  const text = String(id ?? '');
  return text.length > 10 ? `${text.slice(0, 8)}…` : text;
}

/**
 * What a run is about, as links to the records themselves.
 *
 * A run holds `targetIds` — a SET, since one run can be started over several
 * records at once — and nothing else about them. Which kind of record they are
 * comes from the workflow, not the run, so `targetTypeKey` is passed in.
 *
 * Renders nothing when a workflow tracks nothing, which is the normal case for
 * those runs rather than a gap to point at. A type with nowhere to send anybody
 * (a BOQ item on a run that does not say which project it belongs to) shows the
 * ids as plain text instead of a link that cannot be built.
 *
 * `newTab` (2026-10-14) opens the record in a new tab — from a task's form,
 * so looking at the request does not throw away what was typed.
 *
 * @param {{ targetTypeKey: number|null, targetIds: string[], projectCode: string|null, size?: 'xs'|'sm', newTab?: boolean }} props
 */
export default function TargetLinks({ targetTypeKey, targetIds = [], projectCode = null, size = 'sm', newTab = false }) {
  if (targetIds.length === 0) return null;

  const text = size === 'xs' ? 'text-[11px]' : 'text-xs';
  const iconSize = size === 'xs' ? 10 : 12;
  const label = TARGET_TYPE_LABELS[targetTypeKey] ?? 'Record';

  const hrefFor = (id) => {
    if (targetTypeKey === TARGET_TYPE.INVOICE) return ROUTES.INVOICE_DETAIL(id);
    if (targetTypeKey === TARGET_TYPE.BOQ_ITEM && projectCode) {
      return ROUTES.PROJECT_BOQ_ITEM(encodeURIComponent(projectCode), id);
    }
    // A change request lives under its project (2026-10-19).
    if (targetTypeKey === TARGET_TYPE.BOQ_CHANGE_REQUEST && projectCode) {
      return ROUTES.PROJECT_CHANGE_REQUEST(encodeURIComponent(projectCode), id);
    }
    // A project's id IS its code, so it needs nothing else to link.
    if (targetTypeKey === TARGET_TYPE.PROJECT) return ROUTES.PROJECT_DETAIL(encodeURIComponent(id));
    return null;
  };

  const Icon = targetTypeKey === TARGET_TYPE.BOQ_ITEM
    ? LayoutList
    : targetTypeKey === TARGET_TYPE.PROJECT ? FolderKanban
      : targetTypeKey === TARGET_TYPE.BOQ_CHANGE_REQUEST ? FileDiff : FileText;

  return (
    <span className="flex flex-col gap-0.5">
      {targetIds.map((id) => {
        const href = hrefFor(id);
        const body = (
          <>
            <Icon size={iconSize} style={{ color: CHROME.textMuted }} aria-hidden="true" />
            View {label}
          </>
        );

        if (!href) {
          return (
            <span
              key={id}
              className={`inline-flex items-center gap-1 ${text}`}
              style={{ color: CHROME.textMuted }}
              title={String(id)}
            >
              {body}
            </span>
          );
        }

        return (
          <Link
            key={id}
            href={href}
            onClick={(e) => e.stopPropagation()}
            {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={`relative z-20 inline-flex items-center gap-1 underline-offset-2 hover:underline ${text}`}
            style={{ color: STATUS.info }}
            title={newTab ? `Open ${label.toLowerCase()} in a new tab` : `Open ${label.toLowerCase()}`}
          >
            {body}
            {newTab && <ExternalLink size={iconSize} aria-hidden="true" />}
          </Link>
        );
      })}
    </span>
  );
}
