'use client';

import { AlertTriangle, Plus, X } from 'lucide-react';

import Button from '@/components/common/Button';
import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * One address line (To or CC): a box and its Add button (Enter adds too), the
 * addresses added so far — each removable — the old email's addresses to add
 * with a click, and what is wrong.
 */
function AddressLine({ label, line, resend }) {
  const addresses = resend[line];
  const problem = resend.problems[line];
  const inputId = `resend-${line}`;

  return (
    <div>
      <label htmlFor={inputId} className={labelClass} style={{ color: CHROME.textSecondary }}>{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          id={inputId}
          type="text"
          inputMode="email"
          autoComplete="off"
          value={resend.boxes[line]}
          onChange={(e) => resend.setBox(line, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              resend.add(line);
            }
          }}
          placeholder="name@example.com"
          aria-invalid={Boolean(problem)}
          className={`${controlClass} min-w-0 flex-1`}
          style={problem ? { borderColor: STATUS.critical } : undefined}
        />
        <Button
          size="sm"
          variant="outline"
          icon={Plus}
          onClick={() => resend.add(line)}
          disabled={!resend.boxes[line].trim()}
        >
          Add
        </Button>
      </div>

      {addresses.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-1" aria-label={`${label} addresses`}>
          {addresses.map((address) => (
            <li
              key={address}
              className="inline-flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1 text-[11px]"
              style={{ backgroundColor: withAlpha(STATUS.info, 0.1), color: CHROME.textPrimary }}
            >
              {address}
              <button
                type="button"
                onClick={() => resend.remove(line, address)}
                className="rounded-full p-0.5 transition-colors hover:bg-white/70"
                aria-label={`Remove ${address}`}
                style={{ color: CHROME.textMuted }}
              >
                <X size={10} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {resend.suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="text-[10px]" style={{ color: CHROME.textMuted }}>On the email before:</span>
          {resend.suggestions.map((address) => (
            <button
              key={address}
              type="button"
              onClick={() => resend.add(line, address)}
              className="inline-flex items-center gap-0.5 rounded-full border border-[#eceae4] px-1.5 py-px text-[10px] transition-colors hover:bg-[#f6f5f3]"
              style={{ color: CHROME.textSecondary }}
              title={`Add ${address} to ${label}`}
            >
              <Plus size={9} aria-hidden="true" />
              {address}
            </button>
          ))}
        </div>
      )}

      {problem && <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{problem}</p>}
    </div>
  );
}

/**
 * Who a resend goes to (2026-10-13): the person it was for again — ticked by
 * default, at the address they have now — and To / CC addresses added one at a
 * time, which get the email only. Each person gets their own copy; every email
 * shows the same To and CC lines.
 *
 * @param {{ resend: ReturnType<import('./useResend').useResend>, previousName: string }} props
 */
export default function ResendRecipients({ resend, previousName }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#f1f0ee] p-3">
      <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: CHROME.textPrimary }}>
        <input
          type="checkbox"
          checked={resend.includePrevious}
          onChange={(e) => resend.setIncludePrevious(e.target.checked)}
        />
        Send to {previousName} again
      </label>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <AddressLine label="To" line="to" resend={resend} />
        <AddressLine label="CC" line="cc" resend={resend} />
      </div>

      <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
        {resend.copies === 0
          ? 'Nobody yet.'
          : `${resend.copies} ${resend.copies === 1 ? 'copy' : 'copies'} — one each, every email showing the same To and CC lines. Added addresses get the email only; they have no in-app inbox.`}
      </p>

      {resend.typedAny && (
        <p
          className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
          style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
        >
          <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
          Everyone gets the same text, and it was written for {previousName}. Edit it below so it reads right for the
          people you added.
        </p>
      )}
    </div>
  );
}
