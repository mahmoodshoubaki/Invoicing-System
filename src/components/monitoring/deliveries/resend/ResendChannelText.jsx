'use client';

import { memo } from 'react';
import { Bell, Mail } from 'lucide-react';

import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME } from '@/theme/vizPalette';
import { CHANNEL } from '@/constants/notifications';

const TEXTS = [
  ['englishSubject', 'English subject', 'ltr', 0],
  ['arabicSubject', 'Arabic subject', 'rtl', 0],
  ['englishBody', 'English body', 'ltr', 6],
  ['arabicBody', 'Arabic body', 'rtl', 6],
];

/**
 * One channel of a resend: whether it is sent again, and its four texts,
 * edited from what went out.
 *
 * @param {{ row: Object, onChange: (change: Object) => void }} props
 */
function ResendChannelText({ row, onChange }) {
  return (
    <div className="rounded-lg border border-[#f1f0ee] p-3">
      <label className="mb-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: CHROME.textPrimary }}>
        <input type="checkbox" checked={row.include} onChange={(e) => onChange({ include: e.target.checked })} />
        {row.channelKey === CHANNEL.EMAIL ? <Mail size={12} aria-hidden="true" /> : <Bell size={12} aria-hidden="true" />}
        {row.channel}
      </label>
      {row.include && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {TEXTS.map(([key, label, dir, lines]) => (
            <label key={key} className="block">
              <span className={labelClass} style={{ color: CHROME.textSecondary }}>{label}</span>
              {lines ? (
                <textarea dir={dir} rows={lines} value={row[key]} onChange={(e) => onChange({ [key]: e.target.value })} className={`${controlClass} w-full resize-y`} />
              ) : (
                <input dir={dir} value={row[key]} onChange={(e) => onChange({ [key]: e.target.value })} className={`${controlClass} w-full`} />
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ResendChannelText);
