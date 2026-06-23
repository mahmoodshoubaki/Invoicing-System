/**
 * SLA Warning threshold: warn when due date is this many days away.
 */
export const WARNING_DAYS = 7;

/**
 * SLA Critical threshold: trigger a reminder on the due date itself.
 */
export const CRITICAL_DAYS = 0;

/**
 * SLA Escalation levels based on how many days overdue an item is.
 * Level 1: 1 day overdue  → first escalation
 * Level 2: 7 days overdue → second escalation
 * Level 3: 14 days overdue → final escalation
 */
export const SLA_ESCALATION_LEVELS = [
  { level: 1, daysOverdue: 1, label: 'Initial Escalation', description: 'Notify immediate supervisor' },
  { level: 2, daysOverdue: 7, label: 'Secondary Escalation', description: 'Notify department head' },
  { level: 3, daysOverdue: 14, label: 'Final Escalation', description: 'Notify BU Head and management' },
];

/**
 * Billing frequency options for BOQ items.
 */
export const BILLING_FREQUENCY = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ONE_TIME: 'Yearly',
  MILESTONE: 'Milestone',
};

export const BILLING_FREQUENCY_LIST = Object.values(BILLING_FREQUENCY);

/**
 * Default VAT rate in Saudi Arabia.
 */
export const VAT_RATE = 0.15;

/**
 * Determine the SLA status of a date relative to today.
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
 * Get the escalation level for a number of days overdue.
 * Returns null if not overdue.
 * @param {number} daysOverdue
 * @returns {{ level: number, daysOverdue: number, label: string, description: string } | null}
 */
export function getEscalationLevel(daysOverdue) {
  if (daysOverdue <= 0) return null;
  const sorted = [...SLA_ESCALATION_LEVELS].sort((a, b) => b.daysOverdue - a.daysOverdue);
  return sorted.find((e) => daysOverdue >= e.daysOverdue) || null;
}
