'use client';

import { memo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, X } from 'lucide-react';

import Button from '@/components/common/Button';
import { DatePicker, Input, NumberInput, Select, Textarea } from '@/components/forms/FormField';
import InvoicingPlanTracker from '@/components/boq/InvoicingPlanTracker';
import { newItemTotal } from '@/lib/changeRequest/newItemDraft';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils';
import { toISODate } from '@/utils/dateUtils';

/**
 * @param {{ draft: Object, problems: Object|null, plan: { busy?: boolean, error?: string|null }|undefined, window: { start: string, end: string }, locked?: boolean, onField: (key, field, value) => void, onCycles: (key, cycles) => void, onRemove: (key) => void, revealToken: number, }} props
 */
function NewItemCard({ draft, problems, plan, window, locked = false, onField, onCycles, onRemove, revealToken = 0 }) {
  const currency = useSelector((s) => s.ui.currency);
  const frequencies = useSelector(selectBillingFrequencies);
  const errors = problems ?? {};
  const v = draft.values;
  const set = (field) => (e) => onField(draft.key, field, e.target.value);
  const today = toISODate(new Date());
  const earliestBaseline = window.start && window.start > today ? window.start : today;
  const problemCount = Object.keys(errors).length;
  const [open, setOpen] = useState(true);
  const [seenToken, setSeenToken] = useState(revealToken);
  if (revealToken !== seenToken) {
    setSeenToken(revealToken);
    if (problemCount > 0 && !open) setOpen(true);
  }

  return (
    <div className="rounded-xl border border-[#eceae4] bg-white p-4">
      <div className={`flex items-start justify-between gap-3 ${open ? 'mb-3' : ''}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="press-flat flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <ChevronDown
            size={16}
            className={`mt-0.5 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
            style={{ color: CHROME.textMuted }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
              {v.englishName.trim() || 'New item'}
              <span className="ml-1.5 rounded-full px-1.5 py-px text-[10px] font-semibold" style={{ backgroundColor: '#e7f6ee', color: STATUS.good }}>New</span>
            </span>
            <span className="block text-[11px]" style={{ color: CHROME.textMuted }}>
              {formatCurrency(newItemTotal(v), currency)}
              {problemCount > 0 && <span style={{ color: STATUS.critical }}> · {problemCount} to fix</span>}
            </span>
          </span>
        </button>
        {!locked && <Button size="sm" variant="ghost" icon={X} onClick={() => onRemove(draft.key)}>Remove</Button>}
      </div>

      {open && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="English Description" required value={v.englishName} onChange={set('englishName')} disabled={locked} error={errors.englishName} />
            <Input label="Arabic Description" required dir="rtl" value={v.arabicName} onChange={set('arabicName')} disabled={locked} error={errors.arabicName} />
            <Input label="Quantity" required type="number" min="0" step=".01" value={v.quantity} onChange={set('quantity')} disabled={locked} error={errors.quantity} />
            <NumberInput label={`Unit Cost (${currency})`} required value={v.unitCost} onChange={set('unitCost')} disabled={locked} error={errors.unitCost} />
            <Input
              label="Total Cost"
              readOnly
              value={formatCurrency(newItemTotal(v), currency)}
              hint="Quantity × unit cost"
              className="cursor-not-allowed bg-gray-50"
            />
            <Select
              label="Billing Frequency"
              required
              value={v.billingFrequencyId}
              onChange={set('billingFrequencyId')}
              disabled={locked}
              placeholder="Select frequency"
              options={frequencies.map((f) => ({ value: String(f.id), label: f.label }))}
              error={errors.billingFrequencyId}
            />
            <DatePicker
              label="Baseline Expected Invoicing Date"
              required
              value={v.baselineInvoicingDate}
              onChange={set('baselineInvoicingDate')}
              min={earliestBaseline}
              max={window.end || undefined}
              disabled={locked}
              error={errors.baselineInvoicingDate}
            />
            <Input
              label="Updated Expected Invoicing Date"
              readOnly
              value="—"
              hint="Set once the item exists"
              className="cursor-not-allowed bg-gray-50"
            />
            <div className="md:col-span-2">
              <Textarea label="Notes" rows={2} value={v.notes} onChange={set('notes')} disabled={locked} />
            </div>
          </div>

          <div className="mt-4 border-t border-[#f1f0ee] pt-3">
            <p className="mb-2 text-xs font-semibold" style={{ color: CHROME.textSecondary }}>Invoicing plan</p>
            {(!window.start || !window.end) && (
              <p className="mb-2 text-[11px]" style={{ color: STATUS.critical }}>
                The project has no contract dates, so this plan can&rsquo;t be generated. Set them under Contract dates.
              </p>
            )}
            <InvoicingPlanTracker
              cycles={draft.cycles}
              onChange={(cycles) => onCycles(draft.key, cycles)}
              minDate={window.start || undefined}
              maxDate={window.end || undefined}
              loading={Boolean(plan?.busy)}
              error={plan?.error ?? null}
              ready={Boolean(v.baselineInvoicingDate && v.billingFrequencyId && window.start && window.end) || draft.cycles.length > 0}
              disabled={locked}
              anchorDateLabel="Baseline Expected Invoicing Date"
            />
            {errors.cycles && <p data-problem className="mt-2 text-xs" style={{ color: STATUS.critical }}>{errors.cycles}</p>}
            {(errors.general ?? []).map((m) => (
              <p key={m} data-problem className="mt-1 text-xs" style={{ color: STATUS.critical }}>{m}</p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(NewItemCard);
