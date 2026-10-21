/**
 * The project's part of a change request (2026-10-19): each EPM sub-project's
 * value, contract start date and contract duration (months), as they are and
 * as the request would leave them. A sub-project is named by its projectUID.
 *
 * Only what the user types is kept (`edits[uid][field]`); the rest reads from
 * the sub-project as loaded. Typing a value back to what it was removes the
 * edit, so "changed" always means different.
 *
 * The finish date is never typed: it is the start plus whole months of
 * duration, worked out the server's way. The project's contract dates are the
 * main project's — a sub-project coded like "23/116" with nothing after it —
 * or, without one, the earliest start to the latest finish of them all.
 */

const day = (value) => (value ? String(value).slice(0, 10) : '');
const MAIN_PROJECT_CODE = /^\d+\/\d+$/;

export const PROJECT_FIELDS = [
  { key: 'projectValue', label: 'Project value', number: true },
  { key: 'contractStartDate', label: 'Contract start date', date: true },
  { key: 'contractDuration', label: 'Contract duration (months)', number: true },
];

/** The sub-projects as the form shows them (text), with their finish date as stored. */
export function subProjectOriginals(subProjects) {
  return (subProjects ?? [])
    .filter((sp) => sp.projectUID)
    .map((sp) => ({
      uid: sp.projectUID,
      code: sp.projectCode ?? '',
      name: sp.projectName ?? sp.projectCode ?? 'Sub-project',
      values: {
        projectValue: sp.projectValue == null ? '' : String(sp.projectValue),
        contractStartDate: day(sp.contractStartDate),
        contractDuration: sp.contractDuration == null ? '' : String(sp.contractDuration),
      },
      contractFinishDate: day(sp.contractFinishDate),
    }));
}

const blank = (value) => String(value ?? '').trim() === '';

function same(field, a, b) {
  if (field.number) return blank(a) || blank(b) ? blank(a) === blank(b) : Number(a) === Number(b);
  return String(a ?? '') === String(b ?? '');
}

/** Sets one sub-project field, dropping the edit when it is back to what it was. */
export function applyProjectEdit(edits, originals, uid, key, value) {
  const original = originals.find((o) => o.uid === uid);
  const field = PROJECT_FIELDS.find((f) => f.key === key);
  if (!original || !field) return edits;
  const mine = { ...(edits[uid] ?? {}) };
  if (same(field, value, original.values[key])) delete mine[key];
  else mine[key] = value;
  const next = { ...edits };
  if (Object.keys(mine).length) next[uid] = mine;
  else delete next[uid];
  return next;
}

/** The start plus whole months, as the server adds them: 31 January + 1 month is 28 February. */
export function finishDateOf(start, months) {
  if (!start || blank(months) || !Number.isFinite(Number(months))) return '';
  const [y, m, d] = start.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + Math.trunc(Number(months)), 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

/** Each sub-project as the request would leave it; a changed one has its finish worked out again. */
export function proposedSubProjects(originals, edits) {
  return originals.map((o) => {
    const mine = edits[o.uid];
    if (!mine) return o;
    const values = { ...o.values, ...mine };
    return { ...o, values, contractFinishDate: finishDateOf(values.contractStartDate, values.contractDuration) };
  });
}

/** The project's contract dates from its sub-projects. Blank when none says. */
export function contractWindow(subProjects) {
  const main = subProjects.filter((p) => MAIN_PROJECT_CODE.test(String(p.code).trim()));
  const dated = main.length ? main : subProjects;
  const starts = dated.map((p) => p.values.contractStartDate).filter(Boolean).sort();
  const ends = dated.map((p) => p.contractFinishDate).filter(Boolean).sort();
  return { start: starts[0] ?? '', end: ends.at(-1) ?? '' };
}

/** The project value: the sub-projects' values added up. */
export const projectValueTotal = (subProjects) => subProjects.reduce((sum, p) => sum + (Number(p.values.projectValue) || 0), 0);

/** Whether any sub-project has a value at all — without one there is nothing to hold the items to. */
export const hasProjectValue = (subProjects) => subProjects.some((p) => !blank(p.values.projectValue));

/** The sub-project fields this request changes: `{ uid, name, key, label, from, to }` each. */
export function changedProjectFields(originals, edits) {
  return originals.flatMap((o) => PROJECT_FIELDS
    .filter((field) => edits[o.uid] && field.key in edits[o.uid])
    .map((field) => ({ uid: o.uid, name: o.name, key: field.key, label: field.label, from: o.values[field.key], to: edits[o.uid][field.key] })));
}
