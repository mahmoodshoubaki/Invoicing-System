'use client';

import { memo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import Button from '@/components/common/Button';
import { DatePicker, Input, NumberInput, Select, Textarea } from '@/components/forms/FormField';
import InvoicingPlanTracker from '@/components/boq/InvoicingPlanTracker';
import { changedItemFields, itemTotal, planChanged } from '@/lib/changeRequest/itemDraft';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { BASE_CURRENCY } from '@/constants/currencies';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatCurrency } from '@/utils';

/**
 * @param {{ draft: Object, problems: Object|null, plan: { busy?: boolean, error?: string|null }|undefined, window: { start: string, end: string }, the contract dates the request leaves onField: (itemId, key, value) => void, onCycles: (itemId, cycles) => void, onRemove: (itemId) => void, revealToken: number, ticks on each refused Submit — a folded card with a problem opens lockFields?: boolean, lockPlan?: boolean, canRemove?: boolean, }} props
 */
function ItemChangeCard({
  draft, problems, plan, window, onField, onCycles, onRemove, revealToken = 0,
  lockFields = false, lockPlan = false, canRemove = true,
}) {
  const currency = BASE_CURRENCY;
  const displayCurrency = useSelector((s) => s.ui.currency);
  const tc = useTranslations('common');
  const t = useTranslations('changeRequests.item');
  const format = useLocaleFormat();
  const billingLabel = useLookupLabel('billingFrequency');
  const frequencies = useSelector(selectBillingFrequencies);
  const errors = problems ?? {};
  const changed = new Set(changedItemFields(draft).map((c) => c.key));
  const frequencyName = (id) => {
    const name = frequencies.find((f) => String(f.id) === String(id))?.label;
    return name ? billingLabel(name) : '—';
  };
  const was = (key, text) => (changed.has(key) ? t('was', { value: text || '—' }) : undefined);
  const set = (key) => (e) => onField(draft.itemId, key, e.target.value);
  const o = draft.original;
  const v = draft.values;
  const count = changed.size + (planChanged(draft) ? 1 : 0);
  const problemCount = Object.keys(errors).length;
  const [open, setOpen] = useState(true);
  const [seenToken, setSeenToken] = useState(revealToken);
  if (revealToken !== seenToken) {
    setSeenToken(revealToken);
    if (problemCount > 0 && !open) setOpen(true);
  }

  return (
    <div className="rounded-xl border border-[#eceae4] bg-white p-4">
      <div
        className={`flex items-start justify-between gap-3 ${open ? "mb-3" : ""}`}
      >
        <ChevronDown
          size={16}
          className={`mt-0.5 shrink-0 transition-transform ${open ? "" : "-rotate-90 rtl:rotate-90"}`}
          style={{ color: CHROME.textMuted, cursor: "pointer" }}
          aria-hidden="true"
          onClick={() => setOpen((v) => !v)}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-2 text-start"
        >
          <span className="min-w-0">
            <span
              className="block truncate text-sm font-semibold"
              style={{ color: CHROME.textPrimary }}
            >
              {draft.name}
            </span>
            <span
              className="block text-[11px]"
              style={{ color: count ? STATUS.info : CHROME.textMuted }}
            >
              {count
                ? t('changes', { count })
                : t('nothingChanged')}
              {problemCount > 0 && (
                <span style={{ color: STATUS.critical }}>
                  {" "}
                  · {t('toFix', { count: problemCount })}
                </span>
              )}
            </span>
          </span>
        </button>
        {canRemove && (
          <Button
            size="sm"
            variant="ghost"
            icon={X}
            onClick={() => onRemove(draft.itemId)}
          >
            {t('takeOut')}
          </Button>
        )}
      </div>

      {open && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t('englishDescription')}
              dir="ltr"
              required
              value={v.englishName}
              onChange={set("englishName")}
              disabled={lockFields}
              hint={was("englishName", o.englishName)}
              error={errors.englishName}
            />
            <Input
              label={t('arabicDescription')}
              required
              dir="rtl"
              value={v.arabicName}
              onChange={set("arabicName")}
              disabled={lockFields}
              hint={was("arabicName", o.arabicName)}
              error={errors.arabicName}
            />
            <Input
              label={t('quantity')}
              required
              type="number"
              min="0"
              step=".01"
              value={v.quantity}
              onChange={set("quantity")}
              disabled={lockFields}
              hint={was("quantity", o.quantity)}
              error={errors.quantity}
            />
            {lockFields ? (
              <Input
                label={t('unitCostIn', { currency: displayCurrency })}
                readOnly
                value={formatCurrency(Number(v.unitCost) || 0, displayCurrency)}
                hint={was("unitCost", formatCurrency(Number(o.unitCost) || 0, displayCurrency))}
                error={errors.unitCost}
                className="cursor-not-allowed bg-gray-50"
              />
            ) : (
              <NumberInput
                label={t('unitCostIn', { currency })}
                required
                value={v.unitCost}
                onChange={set("unitCost")}
                hint={
                  changed.has("unitCost")
                    ? <>{was("unitCost", formatCurrency(Number(o.unitCost) || 0, currency))}<br />{tc('amountsInUsd')}</>
                    : tc('amountsInUsd')
                }
                error={errors.unitCost}
              />
            )}
            <Input
              label={t('totalCost') + " (" + displayCurrency + ")"}
              readOnly
              value={formatCurrency(itemTotal(v), displayCurrency)}
              hint={
                itemTotal(v) !== itemTotal(o)
                  ? t('was', { value: formatCurrency(itemTotal(o), displayCurrency) })
                  : t('totalHint')
              }
              className="cursor-not-allowed bg-gray-50"
            />
            <Select
              label={t('billingFrequency')}
              required
              value={v.billingFrequencyId}
              onChange={set("billingFrequencyId")}
              disabled={lockFields}
              placeholder={t('selectFrequency')}
              options={frequencies.map((f) => ({
                value: String(f.id),
                label: billingLabel(f.label),
              }))}
              hint={was(
                "billingFrequencyId",
                frequencyName(o.billingFrequencyId),
              )}
              error={errors.billingFrequencyId}
            />
            <Input
              label={t('baselineDate')}
              type="text"
              readOnly
              value={format.date(draft.baselineInvoicingDate) || "—"}
              hint={t('baselineHint')}
              className="cursor-not-allowed bg-gray-50"
            />
            <DatePicker
              label={t('updatedDate')}
              required
              value={v.expectedInvoicingDate}
              onChange={set("expectedInvoicingDate")}
              disabled={lockFields}
              hint={was(
                "expectedInvoicingDate",
                format.date(o.expectedInvoicingDate),
              )}
              error={errors.expectedInvoicingDate}
            />
            <div className="md:col-span-2">
              <Textarea
                label={t('notes')}
                rows={2}
                value={v.notes}
                onChange={set("notes")}
                disabled={lockFields}
                hint={was("notes", o.notes)}
              />
            </div>
          </div>

          <div className="mt-4 border-t border-[#f1f0ee] pt-3">
            <p
              className="mb-2 text-xs font-semibold"
              style={{ color: CHROME.textSecondary }}
            >
              {t('invoicingPlan')}
              {planChanged(draft) && (
                <span
                  className="ms-2 rounded-full px-1.5 py-px text-[10px] font-medium"
                  style={{
                    backgroundColor: withAlpha(STATUS.info, 0.12),
                    color: STATUS.info,
                  }}
                >
                  {t('changedBadge')}
                </span>
              )}
            </p>
            {(!window.start || !window.end) && (
              <p
                className="mb-2 text-[11px]"
                style={{ color: STATUS.critical }}
              >
                {window.start
                  ? t('noEndDate')
                  : t('noStartDate')}
              </p>
            )}
            <InvoicingPlanTracker
              cycles={draft.cycles}
              onChange={(cycles) => onCycles(draft.itemId, cycles)}
              minDate={window.start || undefined}
              maxDate={window.end || undefined}
              loading={Boolean(plan?.busy)}
              error={plan?.error ?? null}
              ready={
                Boolean(
                  v.expectedInvoicingDate &&
                  v.billingFrequencyId &&
                  window.start &&
                  window.end,
                ) || draft.cycles.length > 0
              }
              disabled={lockPlan}
              anchorDateLabel={t('updatedDate')}
            />
            {errors.cycles && (
              <p
                data-problem
                className="mt-2 text-xs"
                style={{ color: STATUS.critical }}
              >
                {errors.cycles}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(ItemChangeCard);
