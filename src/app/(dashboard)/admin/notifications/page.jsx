'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { usePermission } from '@/hooks/usePermission';
import { allow } from '@/constants/workflowPermissions';
import { NOTIFICATION_ADMIN_TABS } from '@/components/notifications/admin/adminTabs';

export default function NotificationsAdminLanding() {
  const router = useRouter();
  const { can } = usePermission();
  const first = NOTIFICATION_ADMIN_TABS.find((t) => allow(can, t.permission));

  useEffect(() => {
    router.replace(first ? first.href : '/unauthorized');
  }, [first, router]);

  return null;
}
