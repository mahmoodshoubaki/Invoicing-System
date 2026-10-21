'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Copy, RotateCcw } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { ROUTES } from '@/constants/routes';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS } from '@/constants/workflowPermissions';

/**
 * A failure, said where it happened — with its tracking number.
 *
 * Every error body carries `traceId`, which is the action's tracking number:
 * support types it into the trace page and sees everything the click caused.
 * So it is shown (and copyable), and linked straight to that page for whoever
 * may read it. The message is the backend's own wording, never ours.
 *
 * @param {{ error: Error|string|null, onRetry?: () => void, compact?: boolean }} props
 */
function ErrorNote({ error, onRetry, compact = false }) {
  const { can } = usePermission();
  const [copied, setCopied] = useState(false);
  if (!error) return null;

  const message = typeof error === 'string' ? error : (error.message || 'Something went wrong.');
  const reference = typeof error === 'string' ? null : (error.traceId ?? null);
  const canTrace = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be refused (insecure context); the number is on screen anyway.
    }
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
      style={{ backgroundColor: withAlpha(STATUS.critical, 0.07), border: `1px solid ${withAlpha(STATUS.critical, 0.2)}` }}
    >
      <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: STATUS.critical }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug" style={{ color: CHROME.textPrimary }}>{message}</p>
        {reference && (
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]" style={{ color: CHROME.textMuted }}>
            <span>
              Reference <code className="font-mono" style={{ color: CHROME.textSecondary }}>{reference}</code>
            </span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-0.5 rounded px-1 transition-colors hover:bg-black/5"
              aria-label="Copy the reference"
            >
              {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {canTrace && (
              <Link
                href={ROUTES.MONITORING_TRACE(reference)}
                className="underline-offset-2 hover:underline"
                style={{ color: STATUS.info }}
              >
                See what happened
              </Link>
            )}
          </p>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-black/5"
          style={{ color: CHROME.textSecondary }}
        >
          <RotateCcw size={11} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}

export default memo(ErrorNote);
