const day = (value) => (value ? String(value).slice(0, 10) : '');

export const ITEM_FIELDS = [
  { key: 'englishName', label: 'English description' },
  { key: 'arabicName', label: 'Arabic description' },
  { key: 'quantity', label: 'Quantity', number: true },
  { key: 'unitCost', label: 'Unit cost', number: true },
  { key: 'billingFrequencyId', label: 'Billing frequency' },
  { key: 'expectedInvoicingDate', label: 'Updated expected invoicing date', date: true },
  { key: 'notes', label: 'Notes' },
];

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

export function changedItemFields(draft) {
  return ITEM_FIELDS
    .filter((field) => !same(field, draft.original[field.key], draft.values[field.key]))
    .map((field) => ({ key: field.key, label: field.label, from: draft.original[field.key], to: draft.values[field.key] }));
}

/**
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

export const planChanged = (draft) => cycleChangesOf(draft).length > 0;

export const itemChanges = (draft) => changedItemFields(draft).length > 0 || planChanged(draft);

export function itemTotal(values) {
  const total = Number(values.quantity) * Number(values.unitCost);
  return Number.isFinite(total) ? total : 0;
}
