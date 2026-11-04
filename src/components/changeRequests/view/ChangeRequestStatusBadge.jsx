'use client';

import { memo } from 'react';
import { useSelector } from 'react-redux';

import LookupBadge from '@/components/ui/LookupBadge';
import { selectChangeRequestStatusesMap } from '@/store/slices/lookupsSlice';

function ChangeRequestStatusBadge({ statusId, size = 'sm' }) {
  const status = useSelector(selectChangeRequestStatusesMap)[statusId];
  return <LookupBadge label={status?.label ?? '—'} colorHex={status?.colorHex} size={size} />;
}

export default memo(ChangeRequestStatusBadge);
