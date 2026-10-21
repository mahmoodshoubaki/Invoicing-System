/**
 * What stops a change request (2026-10-18; the server's rules from 2026-10-19),
 * by the part of the form it is about. The user can change anything — the
 * approver decides whether it makes sense — but impossible results are refused,
 * as the server refuses them:
 *
 * - the BOQ's items cannot add up to more than the project value — checked only
 *   when the request moves money (a quantity, a unit cost or a project value),
 *   so a BOQ already over its value does not block a change of dates;
 * - a cycle the request moves or adds must fall inside the contract dates (the
 *   new ones, if the request changes them), and when it changes them, the
 *   items' other cycles cannot end up after the new finish;
 * - no item can be left without a plan cycle.
 *
 * The server also checks the items this request does not touch against new
 * contract dates; the form cannot see their plans, so that one comes back from
 * the server under the request as a whole.
 */

import { CR_DETAILS_MAX } from '@/constants/changeRequests';
import { changedItemFields, cycleChangesOf, itemChanges, itemTotal } from './itemDraft';
import {
  changedProjectFields, contractWindow, hasProjectValue, projectValueTotal, proposedSubProjects,
} from './projectDraft';

const isNumber = (text) => String(text ?? '').trim() !== '' && Number.isFinite(Number(text));
const outside = (date, { start, end }) => (start && date < start) || (end && date > end);

function itemProblems(draft, window, windowChanged) {
  const v = draft.values;
  const problems = {};
  if (!v.englishName.trim()) problems.englishName = 'English description is required.';
  if (!v.arabicName.trim()) problems.arabicName = 'Arabic description is required.';
  if (!isNumber(v.quantity) || Number(v.quantity) <= 0) problems.quantity = 'A quantity above 0 is required.';
  if (!isNumber(v.unitCost) || Number(v.unitCost) < 0) problems.unitCost = 'A unit cost of 0 or more is required.';
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
  const problems = {};
  for (const o of originals) {
    const mine = edits[o.uid];
    if (!mine) continue;
    const found = {};
    if ('projectValue' in mine && (!isNumber(mine.projectValue) || Number(mine.projectValue) <= 0)) {
      found.projectValue = 'A project value above 0 is required.';
    }
    if ('contractStartDate' in mine && !mine.contractStartDate) found.contractStartDate = 'A contract start date is required.';
    if ('contractDuration' in mine && (!isNumber(mine.contractDuration) || Number(mine.contractDuration) < 1)) {
      found.contractDuration = 'A duration of at least 1 month is required.';
    }
    if (Object.keys(found).length) problems[o.uid] = found;
  }
  return problems;
}

/**
 * Everything wrong with a request, or nothing.
 *
 * @param {{ reasons: number[], details: string, projectEdits: Object, items: Array }} draft
 * @param {{ subProjects: Array, allItems: Array }} context  the sub-projects as loaded, and every item of the BOQ
 */
export function changeRequestProblems(draft, { subProjects, allItems }) {
  const proposed = proposedSubProjects(subProjects, draft.projectEdits);
  const window = contractWindow(proposed);
  const before = contractWindow(subProjects);
  const windowChanged = window.start !== before.start || window.end !== before.end;

  const reasons = draft.reasons.length === 0 ? 'Pick at least one reason.' : null;
  const details = draft.details.length > CR_DETAILS_MAX ? `At most ${CR_DETAILS_MAX} characters.` : null;
  const project = projectProblems(subProjects, draft.projectEdits);

  const items = {};
  for (const item of draft.items) {
    const found = itemProblems(item, window, windowChanged);
    if (Object.keys(found).length) items[item.itemId] = found;
  }

  const general = [];
  const projectChanges = changedProjectFields(subProjects, draft.projectEdits);
  if (projectChanges.length + draft.items.filter(itemChanges).length === 0) {
    general.push('Change at least one thing — the project or an item.');
  }
  const unchanged = draft.items.filter((item) => !itemChanges(item));
  if (unchanged.length) {
    const one = unchanged.length === 1;
    general.push(`${unchanged.map((i) => i.name).join(', ')} ${one ? 'is' : 'are'} in the request but not changed — change ${one ? 'it' : 'them'} or take ${one ? 'it' : 'them'} out.`);
  }
  const datedCycleChanges = draft.items.some((item) => cycleChangesOf(item).some((c) => c.newPlannedDate));
  if ((datedCycleChanges || windowChanged) && (!window.start || !window.end)) {
    general.push('The project has no contract dates, so the invoicing plan cannot be checked against them.');
  }
  if (movesMoney(draft, projectChanges) && hasProjectValue(proposed)) {
    const totals = boqTotals(draft, { subProjects, allItems });
    if (totals.itemsTotal > totals.projectValue) general.push('The BOQ items would add up to more than the project value.');
  }

  return withCount({ reasons, details, project, items, general });
}

/** The problems, with how many there are. */
function withCount(problems) {
  const count = (problems.reasons ? 1 : 0) + (problems.details ? 1 : 0)
    + Object.values(problems.project).reduce((n, p) => n + Object.keys(p).length, 0)
    + Object.values(problems.items).reduce((n, p) => n + Object.keys(p).length, 0) + problems.general.length;
  return { ...problems, count };
}

/** Every part of a request — what the create and edit pages ask for. */
export const ALL_PARTS = Object.freeze({
  reasons: true, details: true, detailsRequired: false, fieldChanges: true, cycleChanges: true,
});

/**
 * Only the problems a workflow task can fix (2026-10-20). A task asks for some
 * of the request's parts — its reasons, its details, its item and project
 * changes, its plan changes — and the rest keep what the request has, so a
 * problem there is not the task's to show. A task may also make the details
 * required.
 *
 * @param {Object} problems  changeRequestProblems'
 * @param {typeof ALL_PARTS} asks
 * @param {{ details: string }} draft
 */
export function problemsAskedFor(problems, asks, draft) {
  const changes = asks.fieldChanges || asks.cycleChanges;
  const detailsMissing = asks.detailsRequired && !draft.details.trim() ? 'Additional details are required.' : null;
  return withCount({
    reasons: asks.reasons ? problems.reasons : null,
    details: asks.details ? problems.details ?? detailsMissing : null,
    project: asks.fieldChanges ? problems.project : {},
    items: changes ? problems.items : {},
    general: changes ? problems.general : [],
  });
}

/** Whether the request changes a quantity, a unit cost or a project value. */
export function movesMoney(draft, projectChanges) {
  return projectChanges.some((c) => c.key === 'projectValue')
    || draft.items.some((item) => changedItemFields(item).some((c) => c.key === 'quantity' || c.key === 'unitCost'));
}

/**
 * The BOQ's items added up as the request would leave them — each item in the
 * request at its new total, the rest as they are — beside the project value
 * (the sub-projects' values added up).
 */
export function boqTotals(draft, { subProjects, allItems }) {
  const edited = new Map(draft.items.map((d) => [String(d.itemId), d]));
  const itemsTotal = (allItems ?? []).reduce((sum, item) => {
    const d = edited.get(String(item.id));
    return sum + (d ? itemTotal(d.values) : Number(item.totalCost) || 0);
  }, 0);
  return { itemsTotal, projectValue: projectValueTotal(proposedSubProjects(subProjects, draft.projectEdits)) };
}
