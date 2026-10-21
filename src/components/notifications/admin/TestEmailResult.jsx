import Link from 'next/link';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { ROUTES } from '@/constants/routes';

/** "Open in monitor" — only for a test the backend kept (a template test). */
function MonitorLink({ notificationId }) {
  if (!notificationId) return null;
  return (
    <Link
      href={ROUTES.MONITORING_DELIVERY(notificationId)}
      className="mt-1.5 inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
      style={{ color: STATUS.info }}
    >
      Open in monitor <ExternalLink size={11} aria-hidden="true" />
    </Link>
  );
}

/**
 * What came back from SendTestEmail. `sent: false` is not an error response:
 * it shows the reason, and the fault reason's description when there is one.
 *
 * @param {{ result: object, faultReasons: Record<number, {value: string, description?: string}> }} props
 */
export default function TestEmailResult({ result, faultReasons }) {
  if (!result) return null;

  if (result.sent) {
    return (
      <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: withAlpha(STATUS.good, 0.1), color: CHROME.textSecondary }}>
        <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: STATUS.good }} aria-hidden="true" />
        <div>
          <p>The mail server accepted it. Check the inbox in a minute.</p>
          {result.externalId && <p className="font-mono text-[11px]" style={{ color: CHROME.textMuted }}>{result.externalId}</p>}
          <MonitorLink notificationId={result.notificationId} />
        </div>
      </div>
    );
  }

  const fault = result.faultReasonKey != null ? faultReasons?.[result.faultReasonKey] : null;
  return (
    <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: withAlpha(STATUS.critical, 0.07), color: CHROME.textSecondary }}>
      <XCircle size={14} className="mt-0.5 shrink-0" style={{ color: STATUS.critical }} aria-hidden="true" />
      <div>
        <p style={{ color: CHROME.textPrimary }}>{result.error ?? 'It was not sent.'}</p>
        {fault && (
          <p className="mt-1">
            <strong>{fault.value}.</strong> {fault.description}
          </p>
        )}
        <MonitorLink notificationId={result.notificationId} />
      </div>
    </div>
  );
}
