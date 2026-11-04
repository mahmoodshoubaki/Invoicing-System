import {
  SLA_ESCALATION_LEVELS,
  getSlaStatus,
  WARNING_DAYS,
} from '@/constants/sla';
import { BOQ_STATUS } from '@/constants/statuses';

export const slaService = {
  /**
   * @param {object[]} boqItems
   * @returns {{ boqItem: object, daysOverdue: number, level: object|null }[]}
   */
  checkViolations(boqItems) {
    if (!Array.isArray(boqItems) || boqItems.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const excludedStatuses = [BOQ_STATUS.DRAFT, BOQ_STATUS.INVOICED];

    return boqItems
      .filter((item) => {
        if (!item.expectedInvoicingDate) return false;
        if (excludedStatuses.includes(item.status)) return false;
        return true;
      })
      .map((item) => {
        const due = new Date(item.expectedInvoicingDate);
        due.setHours(0, 0, 0, 0);
        const diffMs = today - due;
        const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return { boqItem: item, daysOverdue };
      })
      .filter(({ daysOverdue }) => daysOverdue > 0)
      .map(({ boqItem, daysOverdue }) => ({
        boqItem,
        daysOverdue,
        level: slaService.getEscalationLevel(daysOverdue),
      }));
  },

  /**
   * @param {number} daysOverdue
   * @returns {{ level: number, daysOverdue: number, label: string, description: string } | null}
   */
  getEscalationLevel(daysOverdue) {
    if (daysOverdue <= 0) return null;

    // Sort descending so we match the highest applicable level
    const sorted = [...SLA_ESCALATION_LEVELS].sort(
      (a, b) => b.daysOverdue - a.daysOverdue
    );

    return sorted.find((e) => daysOverdue >= e.daysOverdue) ?? null;
  },

  /**
   * @param {{ boqItem: object, daysOverdue: number, level: object|null }} violation
   * @returns {object}
   */
  generateEscalationRecord(violation) {
    const { boqItem, daysOverdue, level } = violation;

    return {
      id: `esc-${boqItem.id}-${Date.now()}`,
      boqItemId: boqItem.id,
      projectId: boqItem.projectId,
      daysOverdue,
      escalationLevel: level?.level ?? 0,
      escalationLabel: level?.label ?? 'Unclassified',
      escalationDescription: level?.description ?? '',
      dueDate: boqItem.expectedInvoicingDate,
      itemDescription: boqItem.englishItem || boqItem.arabicItem || 'BOQ Item',
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * @param {object[]} boqItems
   * @returns {{ openViolations: number, byLevel: { 1: number, 2: number, 3: number }, totalOverdue: number, warnings: number, violations: object[], upcomingDue: object[], }}
   */
  getSLADashboardData(boqItems) {
    if (!Array.isArray(boqItems) || boqItems.length === 0) {
      return {
        openViolations: 0,
        byLevel: { 1: 0, 2: 0, 3: 0 },
        totalOverdue: 0,
        warnings: 0,
        violations: [],
        upcomingDue: [],
      };
    }

    const violations = slaService.checkViolations(boqItems);

    const byLevel = { 1: 0, 2: 0, 3: 0 };
    let totalOverdue = 0;

    violations.forEach(({ daysOverdue, level }) => {
      totalOverdue += daysOverdue;
      if (level?.level) {
        byLevel[level.level] = (byLevel[level.level] || 0) + 1;
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const excludedStatuses = [BOQ_STATUS.DRAFT, BOQ_STATUS.INVOICED];

    const upcomingDue = boqItems
      .filter((item) => {
        if (!item.expectedInvoicingDate) return false;
        if (excludedStatuses.includes(item.status)) return false;
        const status = getSlaStatus(item.expectedInvoicingDate, WARNING_DAYS);
        return status === 'warning' || status === 'critical';
      })
      .map((item) => ({
        ...item,
        slaStatus: getSlaStatus(item.expectedInvoicingDate, WARNING_DAYS),
      }));

    return {
      openViolations: violations.length,
      byLevel,
      totalOverdue,
      warnings: upcomingDue.length,
      violations,
      upcomingDue,
    };
  },

  /**
   * @param {object} boqItem
   * @returns {'overdue'|'critical'|'warning'|'normal'|'unknown'}
   */
  getItemSLAStatus(boqItem) {
    if (!boqItem?.expectedInvoicingDate) return 'unknown';
    if ([BOQ_STATUS.DRAFT, BOQ_STATUS.INVOICED].includes(boqItem.status)) {
      return 'normal';
    }
    return getSlaStatus(boqItem.expectedInvoicingDate, WARNING_DAYS);
  },
};
