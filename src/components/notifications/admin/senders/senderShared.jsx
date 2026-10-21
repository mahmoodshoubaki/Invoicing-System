'use client';

/** Shared by the sender screens: the SMTP security fallbacks, blank forms, and a labelled field. */

import { labelClass } from '@/components/ui/kit';
import { CHROME } from '@/theme/vizPalette';

/** The documented keys, for when the lookup cannot be read. */
export const FALLBACK_SECURITY = [
  { key: 1, value: 'Auto' },
  { key: 2, value: 'None' },
  { key: 3, value: 'SSL on connect' },
  { key: 4, value: 'STARTTLS' },
];

export const BLANK_SMTP = { name: '', fromAddress: '', fromName: '', host: '', port: 587, securityKey: 4, userName: '', password: '' };

export const BLANK_SES = { name: '', fromAddress: '', fromName: '', region: '', accessKeyId: '', secretAccessKey: '', configurationSet: '' };

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className={labelClass} style={{ color: CHROME.textSecondary }}>
        {label}
        {hint && <span className="ml-1 font-normal" style={{ color: CHROME.textMuted }}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}
