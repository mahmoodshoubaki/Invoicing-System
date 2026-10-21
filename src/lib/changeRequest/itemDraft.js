/**
 * One BOQ item inside a change request (2026-10-18, sent to the API from
 * 2026-10-19): the item as it is, and
 * as the request would leave it.
 *
 * Values are kept as the form's text, the way the BOQ item edit form keeps
 * them; a field "changed" when its text differs (numbers by value, so "10" and
 * "10.00" are the same). The invoicing plan is compared on the cycles not yet
 * invoiced — those are the ones a request can move, add or drop.
 */

const day = (value) => (value ? String(value).slice(0, 10) : '');

/** The fields a request can change, in the order the card shows them. */
export const ITEM_FIELDS = [
  { key: 'englishName', label: 'English description' },
  { key: 'arabicName', label: 'Arabic description' },
  { key: 'quantity', label: 'Quantity', number: true },
  { key: 'unitCost', label: 'Unit cost', number: true },
  { key: 'billingFrequencyId', label: 'Billing frequency' },
  { key: 'expectedInvoicingDate', label: 'Updated expected invoicing date', date: true },
  { key: 'notes', label: 'Notes' },
];

/** The two fields that rebuild an item's invoicing plan when changed, as on the edit form. */
export const PLAN_ANCHORS = ['billingFrequencyId', 'expectedInvoicingDate'];

function valuesOf(item) {
  return {
    englishName: item.englishName ?? '',
    arabicName: item.arabicName ?? '',
    quantity: item.quantity == null ? '' : String(item.quantity),
    unitCost: item.unitCost == null ? '' : String(item.unitCost),
    billingFrequencyId: item.billingFrequencyId == null ? '' : String(item.billingFrequencyId),
    expectedInvoicingDate: day(item.expectedInvoicingDate),
    notes: item.notes ?? '',
  };
}

/** A plan's cycles as the draft keeps them: planned dates as days. */
export function toPlanCycles(cycles) {
  return (cycles ?? []).map((c) => ({
    id: c.id ?? null,
    cycleNumber: c.cycleNumber,
    totalCycles: c.totalCycles,
    plannedDate: day(c.plannedDate),
    statusId: c.statusId ?? null,
    isCommitted: c.isCommitted === true,
    varianceDays: c.varianceDays ?? null,
  }));
}

/**
 * A new item draft: the item and its plan as loaded, nothing changed yet. The
 * baseline expected invoicing date is kept to be shown — it was set when the
 * item was created and a request never changes it.
 */
export function itemDraftFrom(item, cycles) {
  const values = valuesOf(item);
  const plan = toPlanCycles(cycles);
  return {
    itemId: item.id,
    name: item.englishName ?? `Item ${item.id}`,
    baselineInvoicingDate: day(item.baselineInvoicingDate),
    original: values,
    values,
    originalCycles: plan,
    cycles: plan,
  };
}

const blank = (value) => String(value ?? '').trim() === '';

function same(field, a, b) {
  if (field.number) return blank(a) || blank(b) ? blank(a) === blank(b) : Number(a) === Number(b);
  return String(a ?? '').trim() === String(b ?? '').trim();
}

/** The fields this draft changes: `{ key, label, from, to }` each. */
export function changedItemFields(draft) {
  return ITEM_FIELDS
    .filter((field) => !same(field, draft.original[field.key], draft.values[field.key]))
    .map((field) => ({ key: field.key, label: field.label, from: draft.original[field.key], to: draft.values[field.key] }));
}

/**
 * How the plan changes, cycle by cycle, as the API takes it (2026-10-19): a
 * cycle that keeps its id but not its date is Moved; one without an id (or an
 * id the item never had) is Added; an id that is gone is Removed. Cycles
 * already invoiced never change. A rebuilt plan comes back as new cycles, so it
 * reads as the old ones removed and the new ones added.
 *
 * @returns {Array<{ cycleId: number|null, newPlannedDate: string|null, kind: 'Moved'|'Added'|'Removed' }>}
 */
export function cycleChangesOf(draft) {
  const before = new Map(draft.originalCycles.filter((c) => !c.isCommitted && c.id != null).map((c) => [c.id, c]));
  const after = draft.cycles.filter((c) => !c.isCommitted);
  const changes = [];
  for (const cycle of after) {
    const was = cycle.id != null ? before.get(cycle.id) : null;
    if (!was) changes.push({ cycleId: null, newPlannedDate: cycle.plannedDate || null, kind: 'Added' });
    else if (was.plannedDate !== cycle.plannedDate) changes.push({ cycleId: cycle.id, newPlannedDate: cycle.plannedDate || null, kind: 'Moved' });
  }
  const kept = new Set(after.map((c) => c.id).filter((id) => id != null));
  for (const id of before.keys()) if (!kept.has(id)) changes.push({ cycleId: id, newPlannedDate: null, kind: 'Removed' });
  return changes;
}

/** Whether the cycles not yet invoiced differ from the item's plan — a date moved, one added or dropped. */
export const planChanged = (draft) => cycleChangesOf(draft).length > 0;

/** Whether this item changes at all. */
export const itemChanges = (draft) => changedItemFields(draft).length > 0 || planChanged(draft);

/** The item's total as the draft would leave it. */
export function itemTotal(values) {
  const total = Number(values.quantity) * Number(values.unitCost);
  return Number.isFinite(total) ? total : 0;
}
