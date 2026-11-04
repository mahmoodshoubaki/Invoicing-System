export const WARNING_DAYS = 7;

export const CRITICAL_DAYS = 0;

export const SLA_ESCALATION_LEVELS = [
  { level: 1, daysOverdue: 1, label: 'Initial Escalation', description: 'Notify immediate supervisor' },
  { level: 2, daysOverdue: 7, label: 'Secondary Escalation', description: 'Notify department head' },
  { level: 3, daysOverdue: 14, label: 'Final Escalation', description: 'Notify BU Head and management' },
];

export const BILLING_FREQUENCY = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ONE_TIME: 'Yearly',
  MILESTONE: 'Milestone',
};

export const BILLING_FREQUENCY_LIST = Object.values(BILLING_FREQUENCY);

export { VAT_RATE } from '@/constants/appConfig';

/**
 * @param {Date|string} dueDate
 * @param {number} warningDays
 * @returns {'overdue'|'critical'|'warning'|'normal'}
 */
export function getSlaStatus(dueDate, warningDays = WARNING_DAYS) {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffMs = due - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === CRITICAL_DAYS) return 'critical';
  if (diffDays <= warningDays) return 'warning';
  return 'normal';
}

/**
 * @param {number} daysOverdue
 * @returns {{ level: number, daysOverdue: number, label: string, description: string } | null}
 */
export function getEscalationLevel(daysOverdue) {
  if (daysOverdue <= 0) return null;
  const sorted = [...SLA_ESCALATION_LEVELS].sort((a, b) => b.daysOverdue - a.daysOverdue);
  return sorted.find((e) => daysOverdue >= e.daysOverdue) || null;
}
