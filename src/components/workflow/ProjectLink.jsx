'use client';

import Link from 'next/link';
import { FolderKanban } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { ROUTES } from '@/constants/routes';

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
