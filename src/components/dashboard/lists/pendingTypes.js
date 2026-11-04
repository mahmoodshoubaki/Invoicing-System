import { FilePen, FileText, ListChecks } from 'lucide-react';

import { invoiceHref } from '@/components/invoices/list/invoiceListColumns';
import { ROUTES } from '@/constants/routes';
import { invoiceNumberOrPending } from '@/utils/invoiceDisplay';
import { plural } from '../sourceNote';

export const PENDING_TYPES = [
  { type: 'invoice', label: 'Invoices', single: 'Invoice', short: 'invoice', icon: FileText },
  { type: 'changeRequest', label: 'Change requests', single: 'Change request', short: 'CR', icon: FilePen },
  { type: 'boqItem', label: 'BOQ items', single: 'BOQ item', short: 'BOQ item', icon: ListChecks },
];

export const pendingType = (type) => PENDING_TYPES.find((t) => t.type === type) ?? null;

export function pendingHref(item) {
  const code = encodeURIComponent(item.projectCode ?? '');
  if (item.type === 'invoice') return invoiceHref(item);
  if (item.type === 'changeRequest') return ROUTES.PROJECT_CHANGE_REQUEST(code, item.id);
  if (item.type === 'boqItem') return ROUTES.PROJECT_BOQ_ITEM(code, item.id);
  return ROUTES.DASHBOARD_PENDING_APPROVALS;
}

export function pendingTitle(item) {
  if (item.type === 'invoice') return invoiceNumberOrPending({ invoiceNumber: item.title });
  return item.title || pendingType(item.type)?.single || '—';
}

export function pendingBreakdown(byType) {
  return byType
    .filter((t) => t.count > 0)
    .map((t) => plural(t.count, pendingType(t.type)?.short ?? t.type))
    .join(' · ');
}
