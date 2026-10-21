'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import PageHeader from '@/components/common/PageHeader';
import PillTabs from '@/components/ui/PillTabs';
import FieldSettingsTable from '@/components/workflow/admin/fields/FieldSettingsTable';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { TARGET_TYPE, TARGET_TYPE_LABELS } from '@/constants/workflow';
import { CHROME } from '@/theme/vizPalette';
import { fetchBuilderCatalogs, selectTargetTypes } from '@/store/slices/workflowSlice';

/**
 * Workflow fields (2026-10-13): which fields of each kind of thing the builder
 * offers, what it calls them, whether a task can be assigned to the person one
 * holds, and which a task can fill — changed here, with no deployment.
 *
 * A column added to the invoices or BOQ items table, or returned by the
 * projects procedure, appears here by itself, Off and not fillable until
 * somebody turns it on. Turning a field Off hides it from the builder's lists
 * only: workflows already using it keep working.
 *
 * Reading is Workflows.Manage (the route guard's rule for /admin/workflow);
 * saving is Workflows.ManageSettings, and without it there is no Save.
 */
export default function WorkflowFieldsPage() {
  const dispatch = useDispatch();
  const { can } = usePermission();
  const canEdit = allow(can, WORKFLOW_PERMISSIONS.MANAGE_SETTINGS);
  const targetTypes = useSelector(selectTargetTypes);

  useEffect(() => {
    if (!targetTypes.length) dispatch(fetchBuilderCatalogs());
  }, [dispatch, targetTypes.length]);

  // Every kind of thing but "None", which has no fields.
  const kinds = useMemo(() => {
    const listed = targetTypes.length
      ? targetTypes.map((t) => ({ key: t.key, label: TARGET_TYPE_LABELS[t.key] ?? t.value }))
      : Object.entries(TARGET_TYPE_LABELS).map(([key, label]) => ({ key: Number(key), label }));
    return listed.filter((k) => k.key !== TARGET_TYPE.NONE);
  }, [targetTypes]);

  const [chosen, setChosen] = useState(TARGET_TYPE.INVOICE);
  const current = kinds.find((k) => k.key === chosen) ?? kinds[0];

  return (
    <div>
      <PageHeader
        title="Workflow fields"
        subtitle="What the workflow builder shows of each kind of thing, by what name, and what a task can fill."
      />

      <div className="mb-3">
        <PillTabs
          tabs={kinds.map((k) => ({ key: String(k.key), label: k.label }))}
          value={String(current?.key ?? '')}
          onChange={(key) => setChosen(Number(key))}
        />
      </div>

      <p className="mb-3 text-xs leading-relaxed" style={{ color: CHROME.textMuted }}>
        A field&rsquo;s name never changes — saved workflows hold it — but its label can. Off hides a field from the
        builder&rsquo;s lists; workflows already using it keep working. A field added later starts Off and not fillable.
      </p>

      {current && (
        <FieldSettingsTable key={current.key} targetTypeKey={current.key} targetLabel={current.label} canEdit={canEdit} />
      )}
    </div>
  );
}
