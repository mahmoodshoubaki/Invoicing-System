import { FilePen, FileText, ListChecks } from 'lucide-react';

import { invoiceHref } from '@/components/invoices/list/invoiceListColumns';
import { ROUTES } from '@/constants/routes';
import { invoiceNumberOrPending } from '@/utils/invoiceDisplay';
import { plural } from '../sourceNote';

/** The kinds GetPendingApprovals returns, in tab order. */
export const PENDING_TYPES = [
  { type: 'invoice', label: 'Invoices', single: 'Invoice', short: 'invoice', icon: FileText },
  { type: 'changeRequest', label: 'Change requests', single: 'Change request', short: 'CR', icon: FilePen },
  { type: 'boqItem', label: 'BOQ items', single: 'BOQ item', short: 'BOQ item', icon: ListChecks },
];

export const pendingType = (type) => PENDING_TYPES.find((t) => t.type === type) ?? null;

/** Where a pending record opens. */
export function pendingHref(item) {
  const code = encodeURIComponent(item.projectCode ?? '');
  if (item.type === 'invoice') return invoiceHref(item);
  if (item.type === 'changeRequest') return ROUTES.PROJECT_CHANGE_REQUEST(code, item.id);
  if (item.type === 'boqItem') return ROUTES.PROJECT_BOQ_ITEM(code, item.id);
  return ROUTES.DASHBOARD_PENDING_APPROVALS;
}

/** The record's own name: invoice number ("Pending" before it has one), CR number or item name. */
export function pendingTitle(item) {
  if (item.type === 'invoice') return invoiceNumberOrPending({ invoiceNumber: item.title });
  return item.title || pendingType(item.type)?.single || '—';
}

/** "14 invoices · 2 CRs · 3 BOQ items", leaving out kinds with none. */
export function pendingBreakdown(byType) {
  return byType
    .filter((t) => t.count > 0)
    .map((t) => plural(t.count, pendingType(t.type)?.short ?? t.type))
    .join(' · ');
}
