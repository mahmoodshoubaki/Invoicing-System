const day = (value) => (value ? String(value).slice(0, 10) : '');

export function parsePlanValue(text) {
  if (!text) return [];
  try {
    const raw = JSON.parse(text);
    if (!Array.isArray(raw)) return [];
    return raw.map((c) => ({
      id: c.id ?? c.Id ?? null,
      cycleNumber: c.cycleNumber ?? c.CycleNumber ?? null,
      totalCycles: c.totalCycles ?? c.TotalCycles ?? raw.length,
      plannedDate: day(c.plannedDate ?? c.PlannedDate),
      statusId: c.statusId ?? c.StatusId ?? null,
      isCommitted: (c.isCommitted ?? c.IsCommitted) === true,
      varianceDays: c.varianceDays ?? null,
    }));
  } catch {
    return [];
  }
}

export function planValueOf(cycles) {
  return JSON.stringify((cycles ?? []).map((c) => ({
    ...(c.id != null ? { id: c.id } : {}),
    cycleNumber: c.cycleNumber,
    totalCycles: c.totalCycles,
    plannedDate: day(c.plannedDate),
    statusId: c.statusId ?? null,
    isCommitted: c.isCommitted === true,
  })));
}

export function planValueToSend(text) {
  return JSON.stringify(
    parsePlanValue(text)
      .filter((c) => !c.isCommitted)
      .map((c) => ({
        ...(c.id != null ? { id: c.id } : {}),
        cycleNumber: c.cycleNumber,
        totalCycles: c.totalCycles,
        plannedDate: c.plannedDate,
      }))
  );
}

export function planValueFromPreview(preview) {
  return planValueOf((preview ?? []).map((c) => ({
    id: c.id ?? null,
    cycleNumber: c.cycleNumber,
    totalCycles: c.totalCycles,
    plannedDate: c.plannedDate,
    statusId: c.statusId ?? null,
    isCommitted: c.isCommitted === true,
  })));
}
