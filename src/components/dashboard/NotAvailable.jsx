import { Hourglass } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';

/** A card whose figures the backend does not give yet. */
export default function NotAvailable({ text = 'Not available yet — the backend has no endpoint for this yet.' }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#e1e0d9] px-5 py-10 text-center">
      <Hourglass size={20} style={{ color: CHROME.textMuted }} aria-hidden="true" />
      <p className="text-xs" style={{ color: CHROME.textMuted }}>{text}</p>
    </div>
  );
}
