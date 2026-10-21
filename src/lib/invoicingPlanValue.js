/**
 * A BOQ item's invoicing plan as a task field (2026-10-13).
 *
 * It arrives as JSON TEXT of every cycle —
 *   [{"id":41,"cycleNumber":2,"totalCycles":4,"plannedDate":"2026-11-30T00:00:00","statusId":1,"isCommitted":false}]
 * — and goes back as JSON text of only the cycles not yet invoiced, as the
 * BOQ item form sends them: an existing cycle keeps its id, a new one has none.
 * Cycles already invoiced (`isCommitted`) are shown locked and never sent.
 *
 * In the task form the value is kept as the full list's text, so the editor
 * can show the locked cycles; only the send strips them.
 */

const day = (value) => (value ? String(value).slice(0, 10) : '');

/** The cycles in a value, ready for the plan editor. Unreadable text is no cycles. */
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

/** The editor's cycles back into the form's value: the full list, as text. */
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

/** What CompleteTask is sent: only the cycles not yet invoiced, as text. */
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

/** The cycles from GetTrackerCyclesPreview (committed ones merged in by the server), as the form's value. */
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
