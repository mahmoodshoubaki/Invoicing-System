import { FlaskConical } from 'lucide-react';
import { CHROME } from '@/theme/vizPalette';

/**
 * Marks a notification sent as a test from the template editor (`isTest`).
 * Dashed and neutral, so it never reads as a delivery status.
 */
export default function TestBadge({ size = 'sm' }) {
  const large = size === 'md';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed font-semibold ${large ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 text-[10px]'}`}
      style={{ borderColor: CHROME.textMuted, color: CHROME.textSecondary }}
      title="Sent as a test from the template editor"
    >
      <FlaskConical size={large ? 11 : 9} aria-hidden="true" />
      Test
    </span>
  );
}
