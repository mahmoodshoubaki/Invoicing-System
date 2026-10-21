'use client';

import { memo } from 'react';
import { Workflow } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { BuilderActions } from '@/lib/workflowBuilderState';
import SettingsPanel from '@/components/workflow/builder/SettingsPanel';
import RunNotificationsPanel from '@/components/workflow/builder/RunNotificationsPanel';
import VariablesPanel from '@/components/workflow/builder/VariablesPanel';
import InspectorShell from './InspectorShell';

export const WORKFLOW_TABS = [
  { key: 'settings', label: 'Settings' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'variables', label: 'Variables' },
];

/**
 * The side panel with nothing on the canvas open: the workflow itself — its
 * name and what starts it, who hears when a run goes wrong, and its variables.
 * The trigger card and its menu open it too.
 */
function WorkflowInspector({
  tab, onTab, state, dispatch, events, targetTypes, catalogsLoaded, notificationTypes, resolvedById, fields,
}) {
  return (
    <InspectorShell
      icon={Workflow}
      accent={STATUS.good}
      kicker="Workflow"
      title={
        <p className="truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
          {state.name || 'Untitled workflow'}
        </p>
      }
      tabs={WORKFLOW_TABS}
      tab={tab}
      onTab={onTab}
    >
      <p className="-mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
        Click a stage or step to edit it here. Right-click one, or press its ⋯, for everything else.
      </p>

      {tab === 'settings' && (
        <>
          <div>
            <label htmlFor="wf-name" className="mb-1 block text-xs font-medium" style={{ color: CHROME.textSecondary }}>
              Name
            </label>
            <input
              id="wf-name"
              value={state.name}
              onChange={(e) => dispatch({ type: BuilderActions.SET_FIELD, field: 'name', value: e.target.value })}
              placeholder="Invoice approval"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <SettingsPanel
            state={state}
            dispatch={dispatch}
            actions={BuilderActions}
            events={events}
            targetTypes={targetTypes}
            catalogsLoaded={catalogsLoaded}
          />
        </>
      )}

      {tab === 'notifications' && (
        <RunNotificationsPanel
          graph={state.graph}
          types={notificationTypes}
          fields={fields}
          onChange={(notifications) => dispatch({ type: BuilderActions.SET_RUN_NOTIFICATIONS, notifications })}
        />
      )}

      {tab === 'variables' && (
        <VariablesPanel
          variables={state.variables}
          dispatch={dispatch}
          actions={BuilderActions}
          resolvedById={resolvedById}
        />
      )}
    </InspectorShell>
  );
}

export default memo(WorkflowInspector);
