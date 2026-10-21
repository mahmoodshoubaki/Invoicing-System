'use client';

import Link from 'next/link';
import { AlertTriangle, History, Lock } from 'lucide-react';

import Button from '@/components/common/Button';
import { ROUTES } from '@/constants/routes';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/** Beside a page's title when this person may look but not change. */
export function ReadOnlyPill() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: '#f1f0ee', color: CHROME.textMuted }}
    >
      <Lock size={10} aria-hidden="true" />
      Read only
    </span>
  );
}

/** To the audit of every workflow setting change. */
export function ChangesButton() {
  return (
    <Link href={ROUTES.MONITORING_AUDIT('workflow')}>
      <Button variant="outline" size="sm" icon={History}>Changes</Button>
    </Link>
  );
}

/** In place of a page this person may not read — the route guard's rule, said on the page too. */
export function NoAccessNote({ children }) {
  return (
    <p
      className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs"
      style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
    >
      <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
      {children}
    </p>
  );
}
