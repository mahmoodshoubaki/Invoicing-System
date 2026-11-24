import { toISODate } from '@/utils/dateUtils';
import { toPlanCycles } from './itemDraft';

const day = (value) => (value ? String(value).slice(0, 10) : '');
const blank = (value) => String(value ?? '').trim() === '';
const isNumber = (text) => !blank(text) && Number.isFinite(Number(text));

export const NEW_ITEM_FIELDS = [
  { key: 'englishName', label: 'English description' },
  { key: 'arabicName', label: 'Arabic description' },
  { key: 'quantity', label: 'Quantity', number: true },
  { key: 'unitCost', label: 'Unit cost', number: true },
  { key: 'baselineInvoicingDate', label: 'Baseline expected invoicing date', date: true },
  { key: 'billingFrequencyId', label: 'Billing frequency' },
  { key: 'notes', label: 'Notes' },
];

export const NEW_ITEM_PLAN_ANCHORS = ['baselineInvoicingDate', 'billingFrequencyId'];

export function emptyNewItem(key) {
  return {
    key,
    values: {
      englishName: '', arabicName: '', quantity: '', unitCost: '',
      baselineInvoicingDate: '', billingFrequencyId: '', notes: '',
    },
    cycles: [],
  };
}

export function newItemFrom(row, key) {
  const dates = (row.plannedDates ?? []).map(day).filter(Boolean).sort();
  return {
    key,
    values: {
      englishName: row.englishName ?? '',
      arabicName: row.arabicName ?? '',
      quantity: row.quantity == null ? '' : String(row.quantity),
      unitCost: row.unitCost == null ? '' : String(row.unitCost),
      baselineInvoicingDate: day(row.baselineInvoicingDate),
      billingFrequencyId: row.billingFrequencyId == null ? '' : String(row.billingFrequencyId),
      notes: row.notes ?? '',
    },
    cycles: toPlanCycles(dates.map((plannedDate, i) => ({ id: null, cycleNumber: i + 1, totalCycles: dates.length, plannedDate }))),
  };
}

export function newItemTotal(values) {
  const total = Number(values.quantity) * Number(values.unitCost);
  return Number.isFinite(total) ? total : 0;
}

export function newItemProblems(draft, window, t, today = toISODate(new Date())) {
  const v = draft.values;
  const problems = {};
  if (blank(v.englishName)) problems.englishName = t('englishRequired');
  if (blank(v.arabicName)) problems.arabicName = t('arabicRequired');
  if (!isNumber(v.quantity) || Number(v.quantity) <= 0) problems.quantity = t('quantityAboveZero');
  if (!isNumber(v.unitCost) || Number(v.unitCost) <= 0) problems.unitCost = t('unitCostAboveZero');
  if (!v.baselineInvoicingDate) problems.baselineInvoicingDate = t('baselineRequired');
  else if (v.baselineInvoicingDate < today) problems.baselineInvoicingDate = t('baselinePast');
  else if (window.start && window.end && (v.baselineInvoicingDate < window.start || v.baselineInvoicingDate > window.end)) {
    problems.baselineInvoicingDate = t('baselineRange');
  }
  if (!v.billingFrequencyId) problems.billingFrequencyId = t('frequencyRequired');
  if (draft.cycles.length === 0) problems.cycles = t('oneCycle');
  else if (draft.cycles.some((c) => !c.plannedDate)) problems.cycles = t('cycleDate');
  else if (window.start && window.end && draft.cycles.some((c) => c.plannedDate < window.start || c.plannedDate > window.end)) {
    problems.cycles = t('cycleRange');
  }
  return problems;
}

export function newItemPayload(draft) {
  const v = draft.values;
  return {
    englishName: v.englishName.trim(),
    arabicName: v.arabicName.trim(),
    quantity: Number(v.quantity),
    unitCost: Number(v.unitCost),
    baselineInvoicingDate: v.baselineInvoicingDate || null,
    billingFrequencyId: Number(v.billingFrequencyId) || null,
    notes: v.notes.trim() || null,
    trackerCycles: draft.cycles.map((c) => ({ plannedDate: c.plannedDate })),
  };
}
