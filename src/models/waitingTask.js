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
