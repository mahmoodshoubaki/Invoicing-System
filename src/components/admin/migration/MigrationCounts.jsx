import { CHROME } from '@/theme/vizPalette';

const LABELS = [
  ['boqItems', 'BOQ items'],
  ['planDates', 'Plan dates'],
  ['invoices', 'Invoices'],
  ['invoiceLines', 'Invoice lines'],
  ['boqFiles', 'BOQ files'],
  ['invoiceFiles', 'Invoice files'],
];

/** What a check found, or an import saved. @param {{ counts: Object<string, number> }} props */
export default function MigrationCounts({ counts }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {LABELS.map(([key, label]) => (
        <div key={key} className="rounded-xl bg-[#f6f5f3] px-3 py-2">
          <dd className="text-lg font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>{counts[key] ?? 0}</dd>
          <dt className="text-[11px]" style={{ color: CHROME.textMuted }}>{label}</dt>
        </div>
      ))}
    </dl>
  );
}
