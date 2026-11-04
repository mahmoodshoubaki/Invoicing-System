import { CLIP_KIND } from './kinds';
import { childLists, findStep, locateStep, stageOfStep } from './tree';

export function orderedSelection(graph, kind, ids = []) {
  const wanted = new Set(ids);
  if (wanted.size === 0) return [];

  if (kind === CLIP_KIND.STAGE) return (graph?.stages ?? []).filter((s) => wanted.has(s.id));

  const picked = [];
  const walk = (steps) => {
    for (const step of steps ?? []) {
      if (wanted.has(step.id)) {
        picked.push(step);
        continue;
      }
      for (const list of childLists(step)) walk(list);
    }
  };
  for (const stage of graph?.stages ?? []) walk(stage.steps);
  return picked;
}

export const NO_SELECTION = { key: null, kind: null, ids: [], anchor: null, last: null };

/**
 * @param {Object} prev
 * @param {string} kind
 * @param {string} id
 * @param {{ key: string|null, range?: boolean, listIds?: string[] }} options
 */
export function nextSelection(prev, kind, id, { key, range = false, listIds = [] }) {
  const current = prev?.key === key && prev?.kind === kind ? prev : { ...NO_SELECTION, key, kind };

  if (range && current.anchor && current.anchor !== id
    && listIds.includes(current.anchor) && listIds.includes(id)) {
    const [from, to] = [listIds.indexOf(current.anchor), listIds.indexOf(id)].sort((a, b) => a - b);
    const span = listIds.slice(from, to + 1);
    // The anchor stays put so the range can be re-dragged; the cursor is the click.
    return { ...current, ids: [...current.ids.filter((x) => !span.includes(x)), ...span], last: id };
  }

  if (current.ids.includes(id)) {
    const ids = current.ids.filter((x) => x !== id);
    // Unticking the cursor hands it back to whatever was ticked before it.
    return { ...current, ids, anchor: id, last: current.last === id ? ids[ids.length - 1] ?? null : current.last };
  }

  return { ...current, ids: [...current.ids, id], anchor: id, last: id };
}

/**
 * @returns {null | { index: number, where: string, stageId?: string, container?: Array, insideParallelBranch?: boolean }}
 */
export function pasteTargetFor(graph, clipKind, selection) {
  if (!clipKind) return null;

  const stages = graph?.stages ?? [];
  let last = null;

  if (selection?.last && selection.ids?.includes(selection.last)) {
    last = selection.kind === CLIP_KIND.STAGE
      ? stages.find((s) => s.id === selection.last) ?? null
      : findStep(graph, selection.last);
  }
  // A selection made without a cursor still has an obvious one: the lowest item.
  if (!last) {
    const picked = orderedSelection(graph, selection?.kind, selection?.ids);
    last = picked[picked.length - 1] ?? null;
  }

  if (clipKind === CLIP_KIND.STAGE) {
    const anchor = !last ? null : selection.kind === CLIP_KIND.STAGE ? last : stageOfStep(graph, last.id);
    const at = anchor ? stages.findIndex((s) => s.id === anchor.id) : -1;
    return at === -1
      ? { index: stages.length, where: 'at the end of the flow' }
      : { index: at + 1, where: `after "${anchor.title || anchor.id}"` };
  }

  if (last && selection.kind === CLIP_KIND.STEP) {
    const at = locateStep(graph, last.id);
    return at ? { ...at, index: at.index + 1, where: `after "${last.title || 'the selected step'}"` } : null;
  }

  if (last && selection.kind === CLIP_KIND.STAGE) {
    return {
      stageId: last.id,
      container: [],
      index: (last.steps ?? []).length,
      insideParallelBranch: false,
      where: `at the end of "${last.title || last.id}"`,
    };
  }

  return null;
}

export function copyItems(items) {
  return JSON.parse(JSON.stringify(items ?? []));
}

export function describeClip(kind, count) {
  const noun = kind === CLIP_KIND.STAGE ? 'stage' : 'step';
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function joinNames(names = []) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
