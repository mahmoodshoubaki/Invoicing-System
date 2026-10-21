/** What is ticked, in what order, where a paste would land, and how to say it. */

import { CLIP_KIND } from './kinds';
import { childLists, findStep, locateStep, stageOfStep } from './tree';

/**
 * The selected stages or steps, in the order they appear in the workflow.
 *
 * Screen order, not click order: a paste should come out the way the author sees
 * the originals, whichever they ticked first.
 *
 * A step ticked INSIDE a block that is also ticked is dropped — copying the
 * block already copies it, and keeping both would paste it twice.
 */
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

/**
 * Nothing ticked.
 *
 * `key` is the workflow a selection was made in. `anchor` is where a Shift
 * range starts. `last` is the item ticked most recently — the paste cursor.
 */
export const NO_SELECTION = { key: null, kind: null, ids: [], anchor: null, last: null };

/**
 * The selection after ticking or unticking one stage or step.
 *
 * Stages and steps are never selected together: they paste into different
 * places, so a mixed selection would have nowhere to go. Ticking the other kind,
 * or ticking in another workflow, starts over.
 *
 * With `range`, everything between the last item ticked and this one is ticked
 * too — but only when both are in `listIds`, the list the click happened in. A
 * range across two stages' step lists has no sensible "between".
 *
 * @param {Object} prev
 * @param {string} kind CLIP_KIND
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
 * Where Ctrl+V puts the clipboard, read off the selection.
 *
 * The cursor is the item ticked LAST — the one just clicked, wherever it is on
 * the screen. Stages go after it (or after the stage holding it, when it is a
 * step), and at the end of the flow when nothing is ticked. Steps go after it in
 * its own list, or at the end of it when it is a stage. With nothing ticked,
 * steps have nowhere to go (null); the "Paste here" lines and each list's own
 * Paste button cover that.
 *
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

/**
 * A detached copy for the clipboard.
 *
 * Taken at copy time, so editing or deleting the originals afterwards does not
 * change what gets pasted. A JSON round trip is enough — a definition is JSON on
 * the wire — and it keeps every object's key order, which matters: `type` must
 * stay the first key of a step.
 */
export function copyItems(items) {
  return JSON.parse(JSON.stringify(items ?? []));
}

/** "1 stage", "3 steps". */
export function describeClip(kind, count) {
  const noun = kind === CLIP_KIND.STAGE ? 'stage' : 'step';
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** "A", "A and B", "A, B and C". */
export function joinNames(names = []) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
