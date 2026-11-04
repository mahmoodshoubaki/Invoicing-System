const num = (value) => (value == null ? null : Number(value));

export function mapFinancialSummary(raw) {
  return {
    projectCount: num(raw?.projectCount) ?? 0,
    activeProjectCount: num(raw?.activeProjectCount) ?? 0,
    projectValue: num(raw?.projectValue),
    revenue: num(raw?.revenue),
    invoiced: num(raw?.invoiced),
    collected: num(raw?.collected),
    workInProgress: num(raw?.workInProgress),
    notCollected: num(raw?.notCollected),
  };
}

export function mapInvoiceSummary(raw) {
  const inProgress = raw?.inProgress ?? {};
  return {
    total: num(raw?.total) ?? 0,
    byStatus: (raw?.byStatus ?? []).map((s) => ({ statusId: s.statusId, count: num(s.count) ?? 0, amount: num(s.amount) ?? 0 })),
    inProgress: {
      count: num(inProgress.count) ?? 0,
      latest: (inProgress.latest ?? []).map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber ?? null,
        projectCode: inv.projectCode ?? null,
        projectName: inv.projectName ?? null,
        totalAmount: num(inv.totalAmount) ?? 0,
        submissionDate: inv.submissionDate ?? null,
        statusId: 2,
      })),
    },
  };
}

export function monthLabel(key) {
  const [year, month] = String(key ?? '').split('-').map(Number);
  if (!year || !month) return String(key ?? '');
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function mapMonthlyTrend(raw) {
  return (raw?.months ?? []).map((row) => ({
    key: row.month,
    month: monthLabel(row.month),
    revenue: num(row.revenue) ?? 0,
    invoiced: num(row.invoiced) ?? 0,
    collected: num(row.collected) ?? 0,
  }));
}

export function mapDelayedCycles(raw) {
  return {
    total: num(raw?.total) ?? 0,
    boqCount: num(raw?.boqCount) ?? 0,
    cycles: (raw?.cycles ?? []).map((c) => ({
      boqItemId: c.boqItemId,
      projectCode: c.projectCode ?? null,
      projectName: c.projectName ?? null,
      itemName: c.itemNameEn || c.itemNameAr || '',
      cycleNumber: num(c.cycleNumber),
      totalCycles: num(c.totalCycles),
      plannedDate: c.plannedDate ?? null,
      daysLate: num(c.daysLate) ?? 0,
    })),
  };
}

export function mapSlaViolations(raw) {
  return {
    total: num(raw?.total) ?? 0,
    tasks: (raw?.tasks ?? []).map((t) => ({
      taskId: t.taskId,
      taskTitle: t.taskTitle ?? '',
      instanceId: t.instanceId,
      projectCode: t.projectCode ?? null,
      projectName: t.projectName ?? null,
      stage: t.stageTitle || t.stageId || null,
      dueOn: t.dueOn ?? null,
      daysLate: num(t.daysLate) ?? 0,
      assignees: t.assignees ?? [],
    })),
  };
}

export function mapPendingApprovals(raw) {
  return {
    total: num(raw?.total) ?? 0,
    byType: (raw?.byType ?? []).map((t) => ({ type: t.type, count: num(t.count) ?? 0 })),
    items: (raw?.items ?? []).map((item) => ({
      type: item.type,
      id: item.id,
      statusId: num(item.statusId),
      projectCode: item.projectCode ?? null,
      projectName: item.projectName ?? null,
      title: item.title || null,
      amount: num(item.amount),
      submittedOn: item.submittedOn ?? null,
      instanceId: item.instanceId ?? null,
      stageTitle: item.stageTitle ?? null,
    })),
  };
}
