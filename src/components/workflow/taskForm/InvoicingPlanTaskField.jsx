'use client';

import { memo, useMemo } from 'react';
import { Info } from 'lucide-react';

import InvoicingPlanTracker from '@/components/boq/InvoicingPlanTracker';
import { labelClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { parsePlanValue, planValueOf } from '@/lib/invoicingPlanValue';

/**
 * @param {{ field: Object, value: string, onChange: (text: string) => void, error?: string|null, disabled?: boolean, context: Object|null, rebuilding?: boolean, rebuildError?: string|null, }} props
 */
function InvoicingPlanTaskField({ field, value, onChange, error = null, disabled = false, context, rebuilding = false, rebuildError = null }) {
  const cycles = useMemo(() => parsePlanValue(value), [value]);
  const rebuilds = Boolean(context?.boqItemId);

  return (
    <div>
      <p className={labelClass} style={{ color: CHROME.textSecondary }}>
        {field.label || field.name}
        {field.required && <span style={{ color: STATUS.critical }}> *</span>}
      </p>
      <InvoicingPlanTracker
        cycles={cycles}
        onChange={(next) => onChange(planValueOf(next))}
        minDate={context?.contractStartDate ?? undefined}
        maxDate={context?.contractFinishDate ?? undefined}
        loading={rebuilding}
        error={rebuildError}
        ready
        disabled={disabled}
        anchorDateLabel="Expected Invoicing Date"
      />
      {!rebuilds && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
          <Info size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
          Changing the billing frequency or the expected date here does not rebuild these cycles — adjust them by
          hand, or answer this task from the BOQ item&rsquo;s own page, where they are rebuilt for you.
        </p>
      )}
      {error && <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{error}</p>}
    </div>
  );
}

export default memo(InvoicingPlanTaskField);
