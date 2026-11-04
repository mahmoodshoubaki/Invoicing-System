'use client';

import Link from 'next/link';
import { ExternalLink, FileDiff, FileText, FolderKanban, LayoutList } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { ROUTES } from '@/constants/routes';
import { TARGET_TYPE, TARGET_TYPE_LABELS } from '@/constants/workflow';

function shortId(id) {
  const text = String(id ?? '');
  return text.length > 10 ? `${text.slice(0, 8)}…` : text;
}

/**
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
    if (targetTypeKey === TARGET_TYPE.BOQ_CHANGE_REQUEST && projectCode) {
      return ROUTES.PROJECT_CHANGE_REQUEST(encodeURIComponent(projectCode), id);
    }
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
