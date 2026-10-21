'use client';

import { memo } from 'react';
import { useSelector } from 'react-redux';

import LookupBadge from '@/components/ui/LookupBadge';
import { selectChangeRequestStatusesMap } from '@/store/slices/lookupsSlice';

/** A change request's status, named and coloured by the server's lookup. */
function ChangeRequestStatusBadge({ statusId, size = 'sm' }) {
  const status = useSelector(selectChangeRequestStatusesMap)[statusId];
  return <LookupBadge label={status?.label ?? '—'} colorHex={status?.colorHex} size={size} />;
}

export default memo(ChangeRequestStatusBadge);
