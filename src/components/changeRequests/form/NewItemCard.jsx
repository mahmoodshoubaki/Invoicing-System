'use client';

import { memo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLookupLabel } from '@/hooks/useLookupLabel';

import Button from '@/components/common/Button';
import { DatePicker, Input, NumberInput, Select, Textarea } from '@/components/forms/FormField';
import InvoicingPlanTracker from '@/components/boq/InvoicingPlanTracker';
import { newItemTotal } from '@/lib/changeRequest/newItemDraft';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { BASE_CURRENCY } from '@/constants/currencies';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils';
import { toISODate } from '@/utils/dateUtils';

/**
 * @param {{ draft: Object, problems: Object|null, plan: { busy?: boolean, error?: string|null }|undefined, window: { start: string, end: string }, locked?: boolean, onField: (key, field, value) => void, onCycles: (key, cycles) => void, onRemove: (key) => void, revealToken: number, }} props
 */
function NewItemCard({ draft, problems, plan, window, locked = false, onField, onCycles, onRemove, revealToken = 0 }) {
  const currency = BASE_CURRENCY;
  const displayCurrency = useSelector((s) => s.ui.currency);
  const tc = useTranslations('common');
  const t = useTranslations('changeRequests.item');
  const billingLabel = useLookupLabel('billingFrequency');
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
          className="press-flat flex min-w-0 flex-1 items-start gap-2 text-start"
        >
          <ChevronDown
            size={16}
            className={`mt-0.5 shrink-0 transition-transform ${open ? '' : '-rotate-90 rtl:rotate-90'}`}
            style={{ color: CHROME.textMuted }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
              {v.englishName.trim() || t('newItem')}
              <span className="ms-1.5 rounded-full px-1.5 py-px text-[10px] font-semibold" style={{ backgroundColor: '#e7f6ee', color: STATUS.good }}>{t('newBadge')}</span>
            </span>
            <span className="block text-[11px]" style={{ color: CHROME.textMuted }}>
              {formatCurrency(newItemTotal(v), displayCurrency)}
              {problemCount > 0 && <span style={{ color: STATUS.critical }}> · {t('toFix', { count: problemCount })}</span>}
            </span>
          </span>
        </button>
        {!locked && <Button size="sm" variant="ghost" icon={X} onClick={() => onRemove(draft.key)}>{t('remove')}</Button>}
      </div>

      {open && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label={t('englishDescription')} dir="ltr" required value={v.englishName} onChange={set('englishName')} disabled={locked} error={errors.englishName} />
            <Input label={t('arabicDescription')} required dir="rtl" value={v.arabicName} onChange={set('arabicName')} disabled={locked} error={errors.arabicName} />
            <Input label={t('quantity')} required type="number" min="0" step=".01" value={v.quantity} onChange={set('quantity')} disabled={locked} error={errors.quantity} />
            {locked ? (
              <Input
                label={t('unitCostIn', { currency: displayCurrency })}
                readOnly
                value={formatCurrency(Number(v.unitCost) || 0, displayCurrency)}
                error={errors.unitCost}
                className="cursor-not-allowed bg-gray-50"
              />
            ) : (
              <NumberInput label={t('unitCostIn', { currency })} required hint={tc('amountsInUsd')} value={v.unitCost} onChange={set('unitCost')} error={errors.unitCost} />
            )}
            <Input
              label={t('totalCost') + " (" + displayCurrency + ")"}
              readOnly
              value={formatCurrency(newItemTotal(v), displayCurrency)}
              hint={t('totalHint')}
              className="cursor-not-allowed bg-gray-50"
            />
            <Select
              label={t('billingFrequency')}
              required
              value={v.billingFrequencyId}
              onChange={set('billingFrequencyId')}
              disabled={locked}
              placeholder={t('selectFrequency')}
              options={frequencies.map((f) => ({ value: String(f.id), label: billingLabel(f.label) }))}
              error={errors.billingFrequencyId}
            />
            <DatePicker
              label={t('baselineDate')}
              required
              value={v.baselineInvoicingDate}
              onChange={set('baselineInvoicingDate')}
              min={earliestBaseline}
              max={window.end || undefined}
              disabled={locked}
              error={errors.baselineInvoicingDate}
            />
            <Input
              label={t('updatedDate')}
              readOnly
              value="—"
              hint={t('setOnceExists')}
              className="cursor-not-allowed bg-gray-50"
            />
            <div className="md:col-span-2">
              <Textarea label={t('notes')} rows={2} value={v.notes} onChange={set('notes')} disabled={locked} />
            </div>
          </div>

          <div className="mt-4 border-t border-[#f1f0ee] pt-3">
            <p className="mb-2 text-xs font-semibold" style={{ color: CHROME.textSecondary }}>{t('invoicingPlan')}</p>
            {(!window.start || !window.end) && (
              <p className="mb-2 text-[11px]" style={{ color: STATUS.critical }}>
                {t('noContractDates')}
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
              anchorDateLabel={t('baselineDate')}
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
