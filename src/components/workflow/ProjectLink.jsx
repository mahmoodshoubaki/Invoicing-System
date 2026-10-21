'use client';

import Link from 'next/link';
import { FolderKanban } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { ROUTES } from '@/constants/routes';

/**
 * The project a workflow's subject belongs to, as a link.
 *
 * Only an invoice or BOQ workflow has one; a workflow that tracks nothing sends
 * `projectCode: null` and this renders nothing at all rather than a dash — the
 * absence is the normal case for that kind of run, not a gap to point at.
 *
 * `/projects/[id]` is keyed by the project CODE, not a numeric id, so the code
 * goes straight into the route. It is encoded because codes can carry
 * characters a path segment cannot.
 *
 * The click is stopped from bubbling so the link still works inside a row that
 * is itself clickable — the monitoring list's rows open the run.
 */
export default function ProjectLink({ projectCode, size = 'sm', className = '' }) {
  if (!projectCode) return null;

  const text = size === 'xs' ? 'text-[11px]' : 'text-xs';

  return (
    <Link
      href={ROUTES.PROJECT_DETAIL(encodeURIComponent(projectCode))}
      onClick={(e) => e.stopPropagation()}
      className={`relative z-20 inline-flex items-center gap-1 font-mono underline-offset-2 hover:underline ${text} ${className}`}
      style={{ color: STATUS.info }}
      title={`Open project ${projectCode}`}
    >
      <FolderKanban size={size === 'xs' ? 10 : 12} style={{ color: CHROME.textMuted }} aria-hidden="true" />
      {projectCode}
    </Link>
  );
}
