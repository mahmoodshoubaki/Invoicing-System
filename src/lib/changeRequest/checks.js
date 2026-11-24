import { CR_DETAILS_MAX } from '@/constants/changeRequests';
import { filesAfterSave, isStillAdding } from '@/lib/taskFileValue';
import { cycleChangesOf, itemChanges, itemTotal } from './itemDraft';
import { newItemProblems, newItemTotal } from './newItemDraft';
import { typeProblems } from './typesDraft';
import {
  changedProjectFields, contractWindow, mainProjectOf, projectValueTotal, proposedFinish, proposedSubProjects,
} from './projectDraft';

const isNumber = (text) => String(text ?? '').trim() !== '' && Number.isFinite(Number(text));
const outside = (date, { start, end }) => (start && date < start) || (end && date > end);

function itemProblems(draft, window, windowChanged, t) {
  const v = draft.values;
  const problems = {};
  if (!v.englishName.trim()) problems.englishName = t('englishRequired');
  if (!v.arabicName.trim()) problems.arabicName = t('arabicRequired');
  if (!isNumber(v.quantity) || Number(v.quantity) < 0) problems.quantity = t('quantityZeroOrMore');
  if (!isNumber(v.unitCost) || Number(v.unitCost) <= 0) problems.unitCost = t('unitCostAboveZero');
  if (!v.billingFrequencyId) problems.billingFrequencyId = t('frequencyRequired');
  if (!v.expectedInvoicingDate) problems.expectedInvoicingDate = t('expectedRequired');

  if (draft.cycles.length === 0) {
    problems.cycles = t('noCycles');
    return problems;
  }
  const changed = cycleChangesOf(draft).filter((c) => c.kind !== 'Removed');
  if (changed.some((c) => !c.newPlannedDate)) problems.cycles = t('cycleDate');
  else if (window.start && window.end && changed.some((c) => outside(c.newPlannedDate, window))) {
    problems.cycles = t('cycleRange');
  } else if (windowChanged && window.end) {
    const moved = new Set(changed.map((c) => c.cycleId).filter((id) => id != null));
    const late = draft.cycles.filter((c) => !c.isCommitted && c.id != null && !moved.has(c.id) && c.plannedDate > window.end);
    if (late.length) problems.cycles = t('cycleAfterEnd', { number: late[0].cycleNumber, date: late[0].plannedDate });
  }
  return problems;
}

function projectProblems(originals, edits, t) {
  const main = mainProjectOf(originals);
  if (!main) return {};
  const mine = edits[main.uid];
  const values = { ...main.values, ...(mine ?? {}) };
  const end = proposedFinish(main, mine);
  const found = {};
  if (!values.contractStartDate) found.contractStartDate = t('startRequired');
  if (!end) found.contractFinishDate = t('endRequired');
  else if (values.contractStartDate && end < values.contractStartDate) {
    found.contractFinishDate = t('endBeforeStart');
  }
  if (mine && 'contractDuration' in mine && (!isNumber(values.contractDuration) || Number(values.contractDuration) < 1)) {
    found.contractDuration = t('durationMin');
  }
  return Object.keys(found).length ? { [main.uid]: found } : {};
}

function filesProblem(files, t) {
  if (!files) return null;
  if (isStillAdding(files)) return t('fileAdding');
  return filesAfterSave(files) === 0 ? t('attachFile') : null;
}

/**
 * @param {{ reasons: number[], details: string, projectEdits: Object, items: Array, newItems?: Array, files?: Object|null }} draft
 * @param {{ subProjects: Array, allItems: Array, types?: Array }} context
 */
export function changeRequestProblems(draft, { subProjects, allItems, types = [], t }) {
  const newDrafts = draft.newItems ?? [];
  const proposed = proposedSubProjects(subProjects, draft.projectEdits);
  const window = contractWindow(proposed);
  const before = contractWindow(subProjects);
  const windowChanged = window.start !== before.start || window.end !== before.end;

  const reasons = draft.reasons.length === 0 ? t('pickReason') : null;
  const typed = typeProblems(draft, types, t);
  const details = draft.details.length > CR_DETAILS_MAX ? t('atMost', { max: CR_DETAILS_MAX }) : null;
  const project = projectProblems(subProjects, draft.projectEdits, t);
  const files = filesProblem(draft.files, t);

  const items = {};
  for (const item of draft.items) {
    const found = itemProblems(item, window, windowChanged, t);
    if (Object.keys(found).length) items[item.itemId] = found;
  }
  const newItems = {};
  for (const item of newDrafts) {
    const found = newItemProblems(item, window, t);
    if (Object.keys(found).length) newItems[item.key] = found;
  }

  const general = [];
  if (!mainProjectOf(subProjects)) {
    general.push(t('noMainProject'));
  }
  const projectChanges = changedProjectFields(subProjects, draft.projectEdits);
  if (projectChanges.length + draft.items.filter(itemChanges).length + newDrafts.length === 0) {
    general.push(t('changeSomething'));
  }
  const unchanged = draft.items.filter((item) => !itemChanges(item));
  if (unchanged.length) {
    general.push(t('unchangedItems', { count: unchanged.length, names: unchanged.map((i) => i.name).join(', ') }));
  }
  const datedCycleChanges = draft.items.some((item) => cycleChangesOf(item).some((c) => c.newPlannedDate));
  if ((datedCycleChanges || windowChanged || newDrafts.length > 0) && (!window.start || !window.end)) {
    general.push(t('noContractDates'));
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
export function problemsAskedFor(problems, asks, draft, t) {
  const changes = asks.fieldChanges || asks.cycleChanges || asks.newItems;
  const detailsMissing = asks.detailsRequired && !draft.details.trim() ? t('detailsRequired') : null;
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

export function boqTotals(draft, { subProjects, allItems }) {
  const edited = new Map(draft.items.map((d) => [String(d.itemId), d]));
  const itemsTotal = (allItems ?? []).reduce((sum, item) => {
    const d = edited.get(String(item.id));
    return sum + (d ? itemTotal(d.values) : Number(item.totalCost) || 0);
  }, 0) + (draft.newItems ?? []).reduce((sum, d) => sum + newItemTotal(d.values), 0);
  return { itemsTotal, projectValue: projectValueTotal(proposedSubProjects(subProjects, draft.projectEdits)) };
}
