'use client';

import Link from 'next/link';
import { PencilLine, Trash2 } from 'lucide-react';

import Button from '@/components/common/Button';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';

/**
 * The draft, at the top of a workflow's versions (2026-10-11): who saved it
 * when, a way into it, and — for whoever may delete — a way to throw it away.
 * It has no number until it is published.
 *
 * @param {{ code: string, row: Object, canManage: boolean, canDiscard: boolean, onDiscard: () => void }} props
 */
export default function DraftVersionRow({ code, row, canManage, canDiscard, onDiscard }) {
  return (
    <li
      className="flex items-center gap-3 rounded-xl border p-3.5"
      style={{ borderColor: withAlpha(STATUS.warning, 0.35), backgroundColor: withAlpha(STATUS.warning, 0.05) }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>Draft</span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: withAlpha(STATUS.warning, 0.14), color: STATUS.warning }}
          >
            <PencilLine size={10} aria-hidden="true" />
            Not published
          </span>
        </div>
        <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
          Saved{row.savedByName ? ` by ${row.savedByName}` : ''}
          {row.savedOn ? `, ${formatDateTime(row.savedOn)}` : ''}. Publish it from the builder.
        </p>
      </div>

      {canManage && (
        <Link href={`${ROUTES.WORKFLOW_BUILDER}?code=${encodeURIComponent(code)}`}>
          <Button size="xs" variant="outline" icon={PencilLine}>Open</Button>
        </Link>
      )}
      {canDiscard && (
        <Button size="xs" variant="ghost" icon={Trash2} onClick={onDiscard} title="Throw the draft away">
          Discard
        </Button>
      )}
    </li>
  );
}
