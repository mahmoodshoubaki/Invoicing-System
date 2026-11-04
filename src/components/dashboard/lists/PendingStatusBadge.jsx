'use client';

import { useSelector } from 'react-redux';

import { StatusBadge } from '@/components/common/Badge';
import ChangeRequestStatusBadge from '@/components/changeRequests/view/ChangeRequestStatusBadge';
import {
  selectBoqItemStatusColorsMap, selectBoqItemStatusesMap, selectInvoiceStatusColorsMap, selectInvoiceStatusesMap,
} from '@/store/slices/lookupsSlice';

/** A pending record's status, from its own kind's status lookup. */
export default function PendingStatusBadge({ type, statusId }) {
  const invoiceLabels = useSelector(selectInvoiceStatusesMap);
  const invoiceColors = useSelector(selectInvoiceStatusColorsMap);
  const boqLabels = useSelector(selectBoqItemStatusesMap);
  const boqColors = useSelector(selectBoqItemStatusColorsMap);

  if (type === 'changeRequest') return <ChangeRequestStatusBadge statusId={statusId} />;
  const invoice = type === 'invoice';
  return (
    <StatusBadge
      status={(invoice ? invoiceLabels : boqLabels)[statusId] ?? '—'}
      colors={(invoice ? invoiceColors : boqColors)[statusId]}
      size="sm"
    />
  );
}
