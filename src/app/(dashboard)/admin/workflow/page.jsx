'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { usePermission } from '@/hooks/usePermission';
import { canOpenWorkflowTab, WORKFLOW_ADMIN_TABS } from '@/components/workflow/admin/workflowAdminTabs';

/** The area's landing route: on to the first page this person may read. */
export default function WorkflowAdminLanding() {
  const router = useRouter();
  const { can } = usePermission();
  const first = WORKFLOW_ADMIN_TABS.find((t) => canOpenWorkflowTab(can, t));

  useEffect(() => {
    router.replace(first ? first.href : '/unauthorized');
  }, [first, router]);

  return null;
}
