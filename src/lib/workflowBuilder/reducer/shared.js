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
