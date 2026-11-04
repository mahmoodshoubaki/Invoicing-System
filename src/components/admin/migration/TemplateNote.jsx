import { Info } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';

export default function TemplateNote() {
  return (
    <div className="mb-5 flex items-start gap-2 rounded-xl bg-[#f6f5f3] px-4 py-3 text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
      <Info size={14} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
      <ul className="list-disc pl-4">
        <li>Each sheet: row 1 headers, row 2 help, row 3 an example. Data starts on row 4; rows 2 and 3 are never read.</li>
        <li>Invoices: an Invoiced Date is needed for Invoiced and Collected invoices, and a Collected Date for Collected ones.</li>
        <li>Invoice Lines have no Billed Unit Price — each line is billed at its item&rsquo;s Unit Cost.</li>
      </ul>
    </div>
  );
}
