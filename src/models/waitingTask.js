/**
 * One to-do a record's workflow is waiting on, and who holds it — the
 * `waitingOn` rows of GetInvoiceById, of each BOQ item row (GetBoqById,
 * GetBoqByProjectCode; 2026-10-21) and of GetChangeRequestById. An assignee of
 * type 1 is a person, 2 a role; `name` is null for a deleted account or role.
 */
export function createWaitingTask(raw) {
  return {
    taskTitle: raw?.taskTitle ?? '',
    assignees: (raw?.assignees ?? []).map((a) => ({
      assigneeTypeKey: a.assigneeTypeKey ?? null,
      assigneeId:      a.assigneeId ?? null,
      name:            a.name ?? null,
    })),
  };
}
