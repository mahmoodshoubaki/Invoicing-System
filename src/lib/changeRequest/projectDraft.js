const day = (value) => (value ? String(value).slice(0, 10) : '');
const MAIN_PROJECT_CODE = /^\d+\/\d+$/;

export const PROJECT_FIELDS = [
  { key: 'contractStartDate', label: 'Contract start date', date: true },
  { key: 'contractFinishDate', label: 'Contract finish date', date: true },
  { key: 'contractDuration', label: 'Contract duration (months)', number: true },
];

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
        contractFinishDate: day(sp.contractFinishDate),
        contractDuration: sp.contractDuration == null ? '' : String(sp.contractDuration),
      },
      contractFinishDate: day(sp.contractFinishDate),
      isMain: sp.isMainProject === true || MAIN_PROJECT_CODE.test(String(sp.projectCode ?? '').trim()),
    }));
}

export const hasMainProject = (rawSubProjects) => subProjectOriginals(rawSubProjects).some((p) => p.isMain);

export const mainProjectOf = (subProjects) => (subProjects ?? []).find((p) => p.isMain) ?? null;

const blank = (value) => String(value ?? '').trim() === '';

function same(field, a, b) {
  if (field.number) return blank(a) || blank(b) ? blank(a) === blank(b) : Number(a) === Number(b);
  return String(a ?? '') === String(b ?? '');
}

export function applyProjectEdit(edits, originals, uid, key, value) {
  const original = originals.find((o) => o.uid === uid);
  const field = PROJECT_FIELDS.find((f) => f.key === key);
  if (!original || !original.isMain || !field) return edits;
  const mine = { ...(edits[uid] ?? {}) };
  if (same(field, value, original.values[key])) delete mine[key];
  else mine[key] = value;
  const next = { ...edits };
  if (Object.keys(mine).length) next[uid] = mine;
  else delete next[uid];
  return next;
}

export function finishDateOf(start, months) {
  if (!start || blank(months) || !Number.isFinite(Number(months))) return '';
  const [y, m, d] = start.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + Math.trunc(Number(months)), 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

const dayValue = (day) => Date.parse(`${day}T00:00:00Z`);

export function monthsToReach(start, end) {
  if (!start || !end) return '';
  const [y1, m1] = start.split('-').map(Number);
  const [y2, m2] = end.split('-').map(Number);
  const guess = (y2 - y1) * 12 + (m2 - m1);
  let best = Math.max(0, guess);
  let bestGap = Infinity;
  for (const months of [guess - 1, guess, guess + 1]) {
    if (months < 0) continue;
    const gap = Math.abs(dayValue(finishDateOf(start, months)) - dayValue(end));
    if (gap < bestGap) {
      best = months;
      bestGap = gap;
    }
  }
  return String(best);
}

export function proposedFinish(original, mine) {
  if (!mine) return original.contractFinishDate;
  if (mine.contractFinishDate) return mine.contractFinishDate;
  const values = { ...original.values, ...mine };
  return finishDateOf(values.contractStartDate, values.contractDuration) || original.contractFinishDate;
}

export function proposedSubProjects(originals, edits) {
  return originals.map((o) => {
    const mine = edits[o.uid];
    if (!mine) return o;
    const contractFinishDate = proposedFinish(o, mine);
    return { ...o, values: { ...o.values, ...mine, contractFinishDate }, contractFinishDate };
  });
}

export function editContractDate(edits, originals, uid, key, value) {
  const original = originals.find((o) => o.uid === uid);
  if (!original?.isMain) return edits;
  let next = applyProjectEdit(edits, originals, uid, key, value);
  const current = () => ({ ...original.values, ...(next[uid] ?? {}) });
  const remeasure = (start, end) => {
    const months = monthsToReach(start, end);
    if (Number(months) >= 1) next = applyProjectEdit(next, originals, uid, 'contractDuration', months);
  };

  if (key === 'contractFinishDate') remeasure(current().contractStartDate, value);
  else if (key === 'contractDuration') next = applyProjectEdit(next, originals, uid, 'contractFinishDate', original.values.contractFinishDate);
  else if (key === 'contractStartDate' && next[uid]?.contractFinishDate) remeasure(value, next[uid].contractFinishDate);
  return next;
}

export function contractWindow(subProjects) {
  const main = subProjects.filter((p) => p.isMain ?? MAIN_PROJECT_CODE.test(String(p.code).trim()));
  const dated = main.length ? main : subProjects;
  const starts = dated.map((p) => p.values.contractStartDate).filter(Boolean).sort();
  const ends = dated.map((p) => p.contractFinishDate).filter(Boolean).sort();
  return { start: starts[0] ?? '', end: ends.at(-1) ?? '' };
}

export const projectValueTotal = (subProjects) => subProjects.reduce((sum, p) => sum + (Number(p.values.projectValue) || 0), 0);

export const hasProjectValue = (subProjects) => subProjects.some((p) => !blank(p.values.projectValue));

export function changedProjectFields(originals, edits) {
  return originals.flatMap((o) => PROJECT_FIELDS
    .filter((field) => edits[o.uid] && field.key in edits[o.uid])
    .map((field) => ({ uid: o.uid, name: o.name, key: field.key, label: field.label, from: o.values[field.key], to: edits[o.uid][field.key] })));
}
