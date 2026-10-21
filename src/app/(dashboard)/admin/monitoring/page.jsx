'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { usePermission } from '@/hooks/usePermission';
import { canOpenTab, MONITORING_TABS } from '@/components/monitoring/monitoringTabs';

/** The area's landing route: on to the first page this person may read. */
export default function MonitoringLanding() {
  const router = useRouter();
  const { can } = usePermission();
  const first = MONITORING_TABS.find((t) => canOpenTab(can, t));

  useEffect(() => {
    router.replace(first ? first.href : '/unauthorized');
  }, [first, router]);

  return null;
}
