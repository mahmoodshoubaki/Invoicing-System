import { FilePen, FileText, ListChecks } from 'lucide-react';

import { invoiceHref } from '@/components/invoices/list/invoiceListColumns';
import { ROUTES } from '@/constants/routes';
import { invoiceNumberOrPending } from '@/utils/invoiceDisplay';

export const PENDING_TYPES = [
  { type: 'invoice', icon: FileText },
  { type: 'changeRequest', icon: FilePen },
  { type: 'boqItem', icon: ListChecks },
];

export const pendingType = (type) => PENDING_TYPES.find((t) => t.type === type) ?? null;

/**
 * @param {(key: string, values?: Object) => string} t translator for the `dashboard` namespace
 * @param {string} type
 * @param {'label'|'single'} form
 */
export function pendingTypeName(t, type, form) {
  return pendingType(type) ? t(`pendingTypes.${type}.${form}`) : type;
}

export function pendingHref(item) {
  const code = encodeURIComponent(item.projectCode ?? '');
  if (item.type === 'invoice') return invoiceHref(item);
  if (item.type === 'changeRequest') return ROUTES.PROJECT_CHANGE_REQUEST(code, item.id);
  if (item.type === 'boqItem') return ROUTES.PROJECT_BOQ_ITEM(code, item.id);
  return ROUTES.DASHBOARD_PENDING_APPROVALS;
}

export function pendingTitle(t, item) {
  if (item.type === 'invoice') return invoiceNumberOrPending({ invoiceNumber: item.title }, t('lists.invoiceNumberPending'));
  return item.title || pendingTypeName(t, item.type, 'single') || '—';
}

export function pendingBreakdown(t, byType) {
  return byType
    .filter((entry) => entry.count > 0)
    .map((entry) => (pendingType(entry.type) ? t(`pendingTypes.${entry.type}.count`, { count: entry.count }) : `${entry.count} ${entry.type}`))
    .join(' · ');
}
