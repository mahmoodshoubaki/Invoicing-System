import { toISODate } from '@/utils/dateUtils';
import { toPlanCycles } from './itemDraft';

const day = (value) => (value ? String(value).slice(0, 10) : '');
const blank = (value) => String(value ?? '').trim() === '';
const isNumber = (text) => !blank(text) && Number.isFinite(Number(text));

/** The fields of a new item, in the order its card shows them. */
export const NEW_ITEM_FIELDS = [
  { key: 'englishName', label: 'English description' },
  { key: 'arabicName', label: 'Arabic description' },
  { key: 'quantity', label: 'Quantity', number: true },
  { key: 'unitCost', label: 'Unit cost', number: true },
  { key: 'baselineInvoicingDate', label: 'Baseline expected invoicing date', date: true },
  { key: 'billingFrequencyId', label: 'Billing frequency' },
  { key: 'notes', label: 'Notes' },
];

/** The two fields a new item's plan is generated from. */
export const NEW_ITEM_PLAN_ANCHORS = ['baselineInvoicingDate', 'billingFrequencyId'];

/** A blank new item. `key` names it in the form and in refusals (newItems[i] follows the list order). */
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

/** A new item as a request holds it — mapChangeRequestNewItem's. */
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

/** Its total. */
export function newItemTotal(values) {
  const total = Number(values.quantity) * Number(values.unitCost);
  return Number.isFinite(total) ? total : 0;
}

/**
 * What stops a new item, by field. Its plan's dates must fall inside the
 * contract dates the request leaves.
 */
export function newItemProblems(draft, window, today = toISODate(new Date())) {
  const v = draft.values;
  const problems = {};
  if (blank(v.englishName)) problems.englishName = 'English description is required.';
  if (blank(v.arabicName)) problems.arabicName = 'Arabic description is required.';
  if (!isNumber(v.quantity) || Number(v.quantity) <= 0) problems.quantity = 'A quantity above 0 is required.';
  if (!isNumber(v.unitCost) || Number(v.unitCost) <= 0) problems.unitCost = 'A unit cost above 0 is required.';
  if (!v.baselineInvoicingDate) problems.baselineInvoicingDate = 'Baseline expected invoicing date is required.';
  else if (v.baselineInvoicingDate < today) problems.baselineInvoicingDate = 'The baseline expected invoicing date can’t be in the past.';
  else if (window.start && window.end && (v.baselineInvoicingDate < window.start || v.baselineInvoicingDate > window.end)) {
    problems.baselineInvoicingDate = 'The baseline expected invoicing date must be within the contract dates.';
  }
  if (!v.billingFrequencyId) problems.billingFrequencyId = 'Billing frequency is required.';
  if (draft.cycles.length === 0) problems.cycles = 'At least one invoicing plan cycle is required.';
  else if (draft.cycles.some((c) => !c.plannedDate)) problems.cycles = 'Every cycle needs a planned date.';
  else if (window.start && window.end && draft.cycles.some((c) => c.plannedDate < window.start || c.plannedDate > window.end)) {
    problems.cycles = 'Every cycle needs a planned date between the contract start and end dates.';
  }
  return problems;
}

/** As the create request takes it. */
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
