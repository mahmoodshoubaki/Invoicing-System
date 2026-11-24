import { collectedSoFar, hasCollection } from '@/models/invoice';
import { CHROME } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';

/**
 * @param {{ invoice: Object, currency: string }} props
 */
export default function CollectedAmountCell({ invoice, currency }) {
  if (!hasCollection(invoice)) {
    return <span className="text-sm" style={{ color: CHROME.textMuted }}>—</span>;
  }
  return (
    <span className="text-sm tabular-nums" style={{ color: CHROME.textSecondary }}>
      {formatCurrency(collectedSoFar(invoice), currency)}
    </span>
  );
}
