/** Helpers every group of reducer handlers uses. */

/**
 * Rebuilds the state around one changed stage — and returns the SAME state when
 * the updater declines to change anything.
 *
 * Several updaters refuse their action (a drag that would displace the
 * otherwise arm, a title commit that resolves to the id it already has). Those
 * used to allocate a fresh state object anyway, which the undo stack could not
 * tell apart from a real edit: Ctrl+Z would consume a step and appear to do
 * nothing. Identity is the signal, so it has to be preserved.
 */
export function replaceStage(state, stageId, updater) {
  let changed = false;

  const stages = state.graph.stages.map((s) => {
    if (s.id !== stageId) return s;
    const next = updater(s);
    if (next !== s) changed = true;
    return next;
  });

  if (!changed) return state;

  return { ...state, graph: { ...state.graph, stages } };
}

export function moveInArray(items, from, to) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
