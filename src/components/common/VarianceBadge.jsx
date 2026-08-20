'use client';

import { memo } from 'react';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

/**
 * Shows how many days late/early an invoiced tracker cycle was submitted,
 * per GetTrackerCycles' `varianceDays` (and the matching field on invoice
 * lines from GetInvoiceById): positive = late, negative = early, 0 = exact.
 * `null` means the line/cycle isn't tied to a tracker plan, or hasn't been
 * invoiced yet.
 */
function VarianceBadge({ days, size = 'md' }) {
  const SIZES = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-xs' };
  const sizeClass = SIZES[size] ?? SIZES.md;

  if (days == null) {
    return <span className="text-xs text-gray-300">—</span>;
  }

  if (days === 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-green-50 text-green-700 ${sizeClass}`}>
        <CheckCircle2 size={12} /> On time
      </span>
    );
  }

  if (days > 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-red-50 text-red-600 ${sizeClass}`}>
        <TrendingUp size={12} /> {days} day{days !== 1 ? 's' : ''} late
      </span>
    );
  }

  const early = Math.abs(days);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-blue-50 text-blue-700 ${sizeClass}`}>
      <TrendingDown size={12} /> {early} day{early !== 1 ? 's' : ''} early
    </span>
  );
}

export default memo(VarianceBadge);
