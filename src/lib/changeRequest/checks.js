import { CR_DETAILS_MAX } from '@/constants/changeRequests';
import { filesAfterSave, isStillAdding } from '@/lib/taskFileValue';
import { changedItemFields, cycleChangesOf, itemChanges, itemTotal } from './itemDraft';
import { newItemProblems, newItemTotal } from './newItemDraft';
import { typeProblems } from './typesDraft';
import {
  changedProjectFields, contractWindow, hasProjectValue, mainProjectOf, projectValueTotal, proposedFinish, proposedSubProjects,
} from './projectDraft';

const isNumber = (text) => String(text ?? '').trim() !== '' && Number.isFinite(Number(text));
const outside = (date, { start, end }) => (start && date < start) || (end && date > end);

function itemProblems(draft, window, windowChanged) {
  const v = draft.values;
  const problems = {};
  if (!v.englishName.trim()) problems.englishName = 'English description is required.';
  if (!v.arabicName.trim()) problems.arabicName = 'Arabic description is required.';
  if (!isNumber(v.quantity) || Number(v.quantity) < 0) problems.quantity = 'A quantity of 0 or more is required.';
  if (!isNumber(v.unitCost) || Number(v.unitCost) <= 0) problems.unitCost = 'A unit cost above 0 is required.';
  if (!v.billingFrequencyId) problems.billingFrequencyId = 'Billing frequency is required.';
  if (!v.expectedInvoicingDate) problems.expectedInvoicingDate = 'Updated expected invoicing date is required.';

  if (draft.cycles.length === 0) {
    problems.cycles = 'This item would have no invoicing plan cycle left.';
    return problems;
  }
  const changed = cycleChangesOf(draft).filter((c) => c.kind !== 'Removed');
  if (changed.some((c) => !c.newPlannedDate)) problems.cycles = 'Every cycle needs a planned date.';
  else if (window.start && window.end && changed.some((c) => outside(c.newPlannedDate, window))) {
    problems.cycles = 'Every cycle needs a planned date between the contract start and end dates.';
  } else if (windowChanged && window.end) {
    const moved = new Set(changed.map((c) => c.cycleId).filter((id) => id != null));
    const late = draft.cycles.filter((c) => !c.isCommitted && c.id != null && !moved.has(c.id) && c.plannedDate > window.end);
    if (late.length) problems.cycles = `Cycle ${late[0].cycleNumber} on ${late[0].plannedDate} would be after the new contract end date.`;
  }
  return problems;
}

function projectProblems(originals, edits) {
  const main = mainProjectOf(originals);
  if (!main) return {};
  const mine = edits[main.uid];
  const values = { ...main.values, ...(mine ?? {}) };
  const end = proposedFinish(main, mine);
  const found = {};
  if (!values.contractStartDate) found.contractStartDate = 'A contract start date is required.';
  if (!end) found.contractFinishDate = 'A contract end date is required.';
  else if (values.contractStartDate && end < values.contractStartDate) {
    found.contractFinishDate = 'The contract can’t end before it starts.';
  }
  if (mine && 'contractDuration' in mine && (!isNumber(values.contractDuration) || Number(values.contractDuration) < 1)) {
    found.contractDuration = 'A duration of at least 1 month is required.';
  }
  return Object.keys(found).length ? { [main.uid]: found } : {};
}

function filesProblem(files) {
  if (!files) return null;
  if (isStillAdding(files)) return 'A file is still being added — a moment.';
  return filesAfterSave(files) === 0 ? 'Attach at least one file.' : null;
}

/**
 * @param {{ reasons: number[], details: string, projectEdits: Object, items: Array, newItems?: Array, files?: Object|null }} draft
 * @param {{ subProjects: Array, allItems: Array, types?: Array }} context
 */
export function changeRequestProblems(draft, { subProjects, allItems, types = [] }) {
  const newDrafts = draft.newItems ?? [];
  const proposed = proposedSubProjects(subProjects, draft.projectEdits);
  const window = contractWindow(proposed);
  const before = contractWindow(subProjects);
  const windowChanged = window.start !== before.start || window.end !== before.end;

  const reasons = draft.reasons.length === 0 ? 'Pick at least one reason.' : null;
  const typed = typeProblems(draft, types);
  const details = draft.details.length > CR_DETAILS_MAX ? `At most ${CR_DETAILS_MAX} characters.` : null;
  const project = projectProblems(subProjects, draft.projectEdits);
  const files = filesProblem(draft.files);

  const items = {};
  for (const item of draft.items) {
    const found = itemProblems(item, window, windowChanged);
    if (Object.keys(found).length) items[item.itemId] = found;
  }
  const newItems = {};
  for (const item of newDrafts) {
    const found = newItemProblems(item, window);
    if (Object.keys(found).length) newItems[item.key] = found;
  }

  const general = [];
  if (!mainProjectOf(subProjects)) {
    general.push('EPM has no main project for this project (a code like 23/116), so no change request can be raised.');
  }
  const projectChanges = changedProjectFields(subProjects, draft.projectEdits);
  if (projectChanges.length + draft.items.filter(itemChanges).length + newDrafts.length === 0) {
    general.push('Change at least one thing — the contract dates, an item, or add a new item.');
  }
  const unchanged = draft.items.filter((item) => !itemChanges(item));
  if (unchanged.length) {
    const one = unchanged.length === 1;
    general.push(`${unchanged.map((i) => i.name).join(', ')} ${one ? 'is' : 'are'} in the request but not changed — change ${one ? 'it' : 'them'} or take ${one ? 'it' : 'them'} out.`);
  }
  const datedCycleChanges = draft.items.some((item) => cycleChangesOf(item).some((c) => c.newPlannedDate));
  if ((datedCycleChanges || windowChanged || newDrafts.length > 0) && (!window.start || !window.end)) {
    general.push('The project has no contract dates, so the invoicing plan cannot be checked against them.');
  }
  if (movesMoney(draft) && hasProjectValue(proposed)) {
    const totals = boqTotals(draft, { subProjects, allItems });
    if (totals.itemsTotal > totals.projectValue) general.push('The BOQ items would add up to more than the project value.');
  }

  return withCount({ reasons, ...typed, details, project, items, newItems, files, general });
}

const fieldCount = (byKey) => Object.values(byKey ?? {}).reduce((n, p) => n + Object.keys(p).length, 0);

function withCount(problems) {
  const count = (problems.reasons ? 1 : 0) + (problems.details ? 1 : 0) + (problems.files ? 1 : 0)
    + (problems.typeKeys ? 1 : 0) + (problems.otherTypeText ? 1 : 0) + (problems.projectEffectKey ? 1 : 0)
    + fieldCount(problems.project) + fieldCount(problems.items) + fieldCount(problems.newItems) + problems.general.length;
  return { ...problems, newItems: problems.newItems ?? {}, files: problems.files ?? null, count };
}

export const ALL_PARTS = Object.freeze({
  reasons: true, types: true, typeText: true, effect: true, details: true, detailsRequired: false,
  fieldChanges: true, cycleChanges: true, newItems: true, files: true,
});

/**
 * @param {Object} problems
 * @param {typeof ALL_PARTS} asks
 * @param {{ details: string }} draft
 */
export function problemsAskedFor(problems, asks, draft) {
  const changes = asks.fieldChanges || asks.cycleChanges || asks.newItems;
  const detailsMissing = asks.detailsRequired && !draft.details.trim() ? 'Additional details are required.' : null;
  return withCount({
    reasons: asks.reasons ? problems.reasons : null,
    typeKeys: asks.types ? problems.typeKeys : null,
    otherTypeText: asks.types || asks.typeText ? problems.otherTypeText : null,
    projectEffectKey: asks.effect ? problems.projectEffectKey : null,
    details: asks.details ? problems.details ?? detailsMissing : null,
    project: asks.fieldChanges ? problems.project : {},
    items: asks.fieldChanges || asks.cycleChanges ? problems.items : {},
    newItems: asks.newItems ? problems.newItems : {},
    files: asks.files ? problems.files : null,
    general: changes ? problems.general : [],
  });
}

export function movesMoney(draft) {
  return (draft.newItems ?? []).length > 0
    || draft.items.some((item) => changedItemFields(item).some((c) => c.key === 'quantity' || c.key === 'unitCost'));
}

export function boqTotals(draft, { subProjects, allItems }) {
  const edited = new Map(draft.items.map((d) => [String(d.itemId), d]));
  const itemsTotal = (allItems ?? []).reduce((sum, item) => {
    const d = edited.get(String(item.id));
    return sum + (d ? itemTotal(d.values) : Number(item.totalCost) || 0);
  }, 0) + (draft.newItems ?? []).reduce((sum, d) => sum + newItemTotal(d.values), 0);
  return { itemsTotal, projectValue: projectValueTotal(proposedSubProjects(subProjects, draft.projectEdits)) };
}
