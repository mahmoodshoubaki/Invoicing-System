'use client';

import { memo } from 'react';
import { useSelector } from 'react-redux';

import LookupBadge from '@/components/ui/LookupBadge';
import { selectChangeRequestStatusesMap } from '@/store/slices/lookupsSlice';
import { localName } from '@/utils/localName';

function ChangeRequestStatusBadge({ statusId, size = 'sm' }) {
  const status = useSelector(selectChangeRequestStatusesMap)[statusId];
  const language = useSelector((s) => s.ui.language);
  return <LookupBadge label={status ? localName(status.label, status.labelAr, language) : '—'} colorHex={status?.colorHex} size={size} />;
}

export default memo(ChangeRequestStatusBadge);
