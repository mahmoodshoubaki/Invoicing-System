'use client';

import { memo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, X } from 'lucide-react';

import Button from '@/components/common/Button';
import { DatePicker, Input, NumberInput, Select, Textarea } from '@/components/forms/FormField';
import InvoicingPlanTracker from '@/components/boq/InvoicingPlanTracker';
import { changedItemFields, itemTotal, planChanged } from '@/lib/changeRequest/itemDraft';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatCurrency, formatDate } from '@/utils';

/**
 * One item in a change request: the same fields as the BOQ item form, starting
 * at what the item has now, each changed one saying what it was — and its
 * invoicing plan, cycles already invoiced locked. The baseline expected
 * invoicing date is shown and locked; the updated one can change. Changing the
 * billing frequency or the updated date rebuilds the plan inside the contract
 * dates the request leaves.
 *
 * It folds away to its header (2026-10-20) — name, how many changes, and how
 * many problems — so a request with several items stays readable.
 *
 * In a workflow task (2026-10-20) the fields or the plan can be locked — the
 * task does not ask for them, so they stay as the request has them — and the
 * item can be taken out only when nothing locked would go with it.
 *
 * @param {{
 *   draft: Object, problems: Object|null, plan: { busy?: boolean, error?: string|null }|undefined,
 *   window: { start: string, end: string },  the contract dates the request leaves
 *   onField: (itemId, key, value) => void, onCycles: (itemId, cycles) => void, onRemove: (itemId) => void,
 *   revealToken: number,  ticks on each refused Submit — a folded card with a problem opens
 *   lockFields?: boolean, lockPlan?: boolean, canRemove?: boolean,
 * }} props
 */
function ItemChangeCard({
  draft, problems, plan, window, onField, onCycles, onRemove, revealToken = 0,
  lockFields = false, lockPlan = false, canRemove = true,
}) {
  const currency = useSelector((s) => s.ui.currency);
  const frequencies = useSelector(selectBillingFrequencies);
  const errors = problems ?? {};
  const changed = new Set(changedItemFields(draft).map((c) => c.key));
  const frequencyName = (id) => frequencies.find((f) => String(f.id) === String(id))?.label ?? '—';
  const was = (key, text) => (changed.has(key) ? `was ${text || '—'}` : undefined);
  const set = (key) => (e) => onField(draft.itemId, key, e.target.value);
  const o = draft.original;
  const v = draft.values;
  const count = changed.size + (planChanged(draft) ? 1 : 0);
  const problemCount = Object.keys(errors).length;
  const [open, setOpen] = useState(true);
  // A refused Submit opens a folded card that has a problem, so the problem can be seen.
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
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <ChevronDown
            size={16}
            className={`mt-0.5 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
            style={{ color: CHROME.textMuted }}
            aria-hidden="true"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{draft.name}</span>
            <span className="block text-[11px]" style={{ color: count ? STATUS.info : CHROME.textMuted }}>
              {count ? `${count} change${count === 1 ? '' : 's'}` : 'Nothing changed yet'}
              {problemCount > 0 && (
                <span style={{ color: STATUS.critical }}> · {problemCount} to fix</span>
              )}
            </span>
          </span>
        </button>
        {canRemove && <Button size="sm" variant="ghost" icon={X} onClick={() => onRemove(draft.itemId)}>Take out</Button>}
      </div>

      {open && (
      <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="English Description" required value={v.englishName} onChange={set('englishName')} disabled={lockFields} hint={was('englishName', o.englishName)} error={errors.englishName} />
        <Input label="Arabic Description" required dir="rtl" value={v.arabicName} onChange={set('arabicName')} disabled={lockFields} hint={was('arabicName', o.arabicName)} error={errors.arabicName} />
        <Input label="Quantity" required type="number" min="0" step=".01" value={v.quantity} onChange={set('quantity')} disabled={lockFields} hint={was('quantity', o.quantity)} error={errors.quantity} />
        <NumberInput label={`Unit Cost (${currency})`} required value={v.unitCost} onChange={set('unitCost')} disabled={lockFields} hint={was('unitCost', formatCurrency(Number(o.unitCost) || 0, currency))} error={errors.unitCost} />
        <Input
          label="Total Cost"
          readOnly
          value={formatCurrency(itemTotal(v), currency)}
          hint={itemTotal(v) !== itemTotal(o) ? `was ${formatCurrency(itemTotal(o), currency)}` : 'Quantity × unit cost'}
          className="cursor-not-allowed bg-gray-50"
        />
        <Select
          label="Billing Frequency"
          required
          value={v.billingFrequencyId}
          onChange={set('billingFrequencyId')}
          disabled={lockFields}
          placeholder="Select frequency"
          options={frequencies.map((f) => ({ value: String(f.id), label: f.label }))}
          hint={was('billingFrequencyId', frequencyName(o.billingFrequencyId))}
          error={errors.billingFrequencyId}
        />
        <Input
          label="Baseline Expected Invoicing Date"
          type="text"
          readOnly
          value={formatDate(draft.baselineInvoicingDate) || '—'}
          hint="Set when the item was created — a request never changes it"
          className="cursor-not-allowed bg-gray-50"
        />
        <DatePicker
          label="Updated Expected Invoicing Date"
          required
          value={v.expectedInvoicingDate}
          onChange={set('expectedInvoicingDate')}
          disabled={lockFields}
          hint={was('expectedInvoicingDate', formatDate(o.expectedInvoicingDate))}
          error={errors.expectedInvoicingDate}
        />
        <div className="md:col-span-2">
          <Textarea label="Notes" rows={2} value={v.notes} onChange={set('notes')} disabled={lockFields} hint={was('notes', o.notes)} />
        </div>
      </div>

      <div className="mt-4 border-t border-[#f1f0ee] pt-3">
        <p className="mb-2 text-xs font-semibold" style={{ color: CHROME.textSecondary }}>
          Invoicing plan
          {planChanged(draft) && (
            <span className="ml-2 rounded-full px-1.5 py-px text-[10px] font-medium" style={{ backgroundColor: withAlpha(STATUS.info, 0.12), color: STATUS.info }}>
              changed
            </span>
          )}
        </p>
        {(!window.start || !window.end) && (
          <p className="mb-2 text-[11px]" style={{ color: STATUS.critical }}>
            {window.start
              ? 'The project has no contract end date, so this plan can’t be generated. Set a contract duration under Project changes — the end date follows from it.'
              : 'The project has no contract start date, so this plan can’t be generated. Set one under Project changes.'}
          </p>
        )}
        <InvoicingPlanTracker
          cycles={draft.cycles}
          onChange={(cycles) => onCycles(draft.itemId, cycles)}
          minDate={window.start || undefined}
          maxDate={window.end || undefined}
          loading={Boolean(plan?.busy)}
          error={plan?.error ?? null}
          ready={Boolean(v.expectedInvoicingDate && v.billingFrequencyId && window.start && window.end) || draft.cycles.length > 0}
          disabled={lockPlan}
          anchorDateLabel="Updated Expected Invoicing Date"
        />
        {errors.cycles && <p data-problem className="mt-2 text-xs" style={{ color: STATUS.critical }}>{errors.cycles}</p>}
      </div>
      </>
      )}
    </div>
  );
}

export default memo(ItemChangeCard);
