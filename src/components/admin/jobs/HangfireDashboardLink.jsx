'use client';

import Link from 'next/link';
import { Gauge } from 'lucide-react';

import Button from '@/components/common/Button';
import { ROUTES } from '@/constants/routes';
import { SYSTEM_PERMISSIONS } from '@/constants/notifications';
import { allow } from '@/constants/workflowPermissions';
import { usePermission } from '@/hooks/usePermission';

export default function HangfireDashboardLink() {
  const { can } = usePermission();
  if (!allow(can, SYSTEM_PERMISSIONS.ADMINISTRATOR)) return null;

  return (
    <Link href={ROUTES.BACKGROUND_JOBS_DASHBOARD}>
      <Button variant="outline" size="sm" icon={Gauge}>Hangfire dashboard</Button>
    </Link>
  );
}
