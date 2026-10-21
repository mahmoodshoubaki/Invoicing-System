'use client';

import { memo } from 'react';

import { CHROME } from '@/theme/vizPalette';

/** Stored one address per line; split the way the server reads it back (any space, comma or semicolon). */
const addressesOf = (text) => String(text ?? '').split(/[\s,;]+/).filter(Boolean);

const same = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();

function Line({ label, addresses, recipientEmail }) {
  if (addresses.length === 0) return null;
  return (
    <>
      <dt className="font-medium" style={{ color: CHROME.textMuted }}>{label}</dt>
      <dd className="min-w-0 break-words" style={{ color: CHROME.textSecondary }}>
        {addresses.map((address, i) => (
          <span key={address}>
            {/* This copy's own reader, picked out of the group. */}
            <span
              style={same(address, recipientEmail) ? { color: CHROME.textPrimary, fontWeight: 600 } : undefined}
              title={same(address, recipientEmail) ? 'This copy was delivered to this address' : undefined}
            >
              {address}
            </span>
            {i < addresses.length - 1 ? ', ' : ''}
          </span>
        ))}
      </dd>
    </>
  );
}

/**
 * The To and Cc lines as the reader saw them (2026-10-08).
 *
 * A notification for several people is ONE email addressed to the whole group
 * — "To: Sara, Mona, Karim · Cc: Ahmad" — but each person's copy is delivered
 * to them alone, which is why the monitor has a row per person. This shows the
 * group the email named, with this copy's reader in bold.
 *
 * @param {{ toEmail: string|null, ccEmail: string|null, recipientEmail: string|null }} props
 */
function EmailHeader({ toEmail, ccEmail, recipientEmail }) {
  const to = addressesOf(toEmail);
  const cc = addressesOf(ccEmail);
  if (to.length === 0 && cc.length === 0) return null;

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>
        The email&rsquo;s header
      </p>
      <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 rounded-lg border border-[#f1f0ee] bg-[#fbfaf9] px-2.5 py-2 font-mono text-[11px]">
        <Line label="To:" addresses={to} recipientEmail={recipientEmail} />
        <Line label="Cc:" addresses={cc} recipientEmail={recipientEmail} />
      </dl>
    </div>
  );
}

export default memo(EmailHeader);
