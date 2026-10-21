'use client';

import { Suspense, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { AlertTriangle } from 'lucide-react';

import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import BuilderHeader from '@/components/workflow/builder/page/BuilderHeader';
import BuilderToolbar from '@/components/workflow/builder/page/BuilderToolbar';
import BuilderVersionBar from '@/components/workflow/builder/page/BuilderVersionBar';
import BuilderProblems from '@/components/workflow/builder/page/BuilderProblems';
import BuilderDialogs from '@/components/workflow/builder/page/BuilderDialogs';
import FlowCanvas from '@/components/workflow/builder/page/FlowCanvas';
import BuilderWorkspace from '@/components/workflow/builder/page/BuilderWorkspace';
import Inspector from '@/components/workflow/builder/inspector/Inspector';
import CardMenu from '@/components/workflow/builder/menu/CardMenu';
import { useBuilderDocument } from '@/components/workflow/builder/page/useBuilderDocument';
import { useNotificationTypes } from '@/components/workflow/builder/page/useNotificationTypes';
import { useBuilderCatalogs } from '@/components/workflow/builder/page/useBuilderCatalogs';
import { useAssigneeNames } from '@/components/workflow/builder/page/useAssigneeNames';
import { useBuilderClipboard } from '@/components/workflow/builder/page/useBuilderClipboard';
import { useBuilderSave } from '@/components/workflow/builder/page/useBuilderSave';
import { useBuilderPublish } from '@/components/workflow/builder/page/useBuilderPublish';
import { useBuilderEditing } from '@/components/workflow/builder/page/useBuilderEditing';
import { useStepTreeContext } from '@/components/workflow/builder/page/useStepTreeContext';
import { useCanvasActions } from '@/components/workflow/builder/page/useCanvasActions';
import { useInspector } from '@/components/workflow/builder/inspector/useInspector';
import { useCardMenu } from '@/components/workflow/builder/menu/useCardMenu';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { ROUTES } from '@/constants/routes';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { validateDefinition } from '@/lib/workflowBuilderState';
import { versionFacts } from '@/lib/workflowDrafts';
import { indexProblems } from '@/lib/workflowProblems';
import { selectRoles, selectRolesLoading } from '@/store/slices/rolesSlice';
import {
  selectActions,
  selectAssigneesById,
  selectCatalogsLoaded,
  selectCurrentDefinitionLoading,
  selectEnabledApiDomains,
  selectEvents,
  selectIsSaving,
  selectTargetTypes,
} from '@/store/slices/workflowSlice';

const Spinner = () => <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

function LoadError({ message }) {
  return (
    <Card>
      <div className="py-12 text-center">
        <AlertTriangle size={28} className="mx-auto mb-3" style={{ color: STATUS.critical }} />
        <p className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>Could not load this workflow</p>
        <p className="mt-1 text-xs" style={{ color: CHROME.textMuted }}>{message}</p>
        <Link href={ROUTES.WORKFLOW}><Button variant="outline" size="sm" className="mt-4">Back to workflows</Button></Link>
      </div>
    </Card>
  );
}

/**
 * The workflow builder. Each part of the screen lives in its own file under
 * components/workflow/builder/page/ — this only wires them together:
 *
 *   useBuilderDocument   the definition, its undo stack, loading it
 *   useBuilderCatalogs   what conditions and steps can read
 *   useAssigneeNames     people's names; assignees who left are dropped
 *   useBuilderClipboard  selecting, copying, cutting, pasting
 *   useBuilderSave       saving the draft, and the problems the server found in it
 *   useBuilderPublish    publishing the draft, making an older version live, discarding the draft
 *   useBuilderEditing    every stage / transition / step edit
 *   useInspector         what the side panel has open (a step, a stage, or the workflow)
 *   useCardMenu          the one right-click / ⋯ menu
 *   useCanvasActions     what a card can do: open, its menu, duplicate, add-and-open
 *   useStepTreeContext   what the nested step editors share
 *
 * The canvas and the side panel form one workspace the height of the window,
 * each scrolling on its own — so the panel is beside whichever card was clicked
 * (BuilderWorkspace, which also lets the panel be resized).
 */
function BuilderContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const versionParam = searchParams.get('version');

  const { can } = usePermission();
  const canPublish = allow(can, WORKFLOW_PERMISSIONS.PUBLISH);
  const canDelete = allow(can, WORKFLOW_PERMISSIONS.DELETE);
  const notificationTypes = useNotificationTypes(allow(can, NOTIFICATION_PERMISSIONS.VIEW));

  const doc = useBuilderDocument({ code, versionParam });
  const { state, dispatch, dirty } = doc;

  const isLoading = useSelector(selectCurrentDefinitionLoading);
  const isSaving = useSelector(selectIsSaving);
  const events = useSelector(selectEvents);
  const actions = useSelector(selectActions);
  const targetTypes = useSelector(selectTargetTypes);
  const catalogsLoaded = useSelector(selectCatalogsLoaded);
  const roles = useSelector(selectRoles);
  const rolesLoading = useSelector(selectRolesLoading);
  const approvedHosts = useSelector(selectEnabledApiDomains);
  const resolvedById = useSelector(selectAssigneesById);

  const catalogs = useBuilderCatalogs({ state, resolvedById });
  const { fields, fieldsByTargetType } = catalogs;
  const { errors, warnings } = useMemo(
    () => validateDefinition(state, fields, fieldsByTargetType, actions, events, notificationTypes),
    [state, fields, fieldsByTargetType, actions, events, notificationTypes]
  );
  useAssigneeNames({ state, dispatch, resolvedById });

  const clip = useBuilderClipboard({ state, workflowKey: code ?? null, dispatch });
  const inspector = useInspector({ graph: state.graph, workflowKey: code ?? null });
  // A new workflow's first save gives it its code; what was ticked, copied and open carries over.
  const { adoptCode: adoptClipCode } = clip;
  const { adoptCode: adoptPanelCode } = inspector;
  const onCodeAssigned = useCallback((saved) => {
    adoptClipCode(saved);
    adoptPanelCode(saved);
  }, [adoptClipCode, adoptPanelCode]);
  const save = useBuilderSave({
    state, dirty, dispatch, loadedKeyRef: doc.loadedKeyRef, onCodeAssigned,
  });
  const { versions, serverProblems } = save;
  const publish = useBuilderPublish({ state, dispatch, versions, save, reload: doc.reload });
  const facts = versionFacts(state, versions);
  // The server's list decides while it describes what is on screen; the builder's own checks stand in otherwise.
  const problemCount = serverProblems ? serverProblems.length : errors.length;
  const serverIndex = useMemo(() => (serverProblems ? indexProblems(serverProblems) : null), [serverProblems]);

  const editing = useBuilderEditing({ stages: state.graph.stages, fields, dispatch });
  const menu = useCardMenu();
  const canvas = useCanvasActions({ state, dispatch, editing, clip, inspector, menu });
  const ctx = useStepTreeContext({
    state,
    lookups: { roles, rolesLoading, resolvedById, actions, approvedHosts },
    catalogs,
    editing,
    clip,
    notificationTypes,
    canvas,
    serverProblems: serverIndex,
  });

  if (isLoading && code && !state.code) return <Spinner />;
  if (doc.loadError) return <LoadError message={doc.loadError} />;

  return (
    <div>
      <BuilderHeader
        state={state}
        dirty={dirty}
        isSaving={isSaving}
        problemCount={problemCount}
        save={save}
        publish={publish}
        openIsActive={facts.openIsActive}
        openVersion={facts.openVersion}
        nextVersion={facts.nextVersion}
        canPublish={canPublish}
      />
      <BuilderToolbar canUndo={doc.canUndo} canRedo={doc.canRedo} onUndo={doc.onUndo} onRedo={doc.onRedo} clip={clip} />
      <BuilderVersionBar
        state={state}
        versions={versions}
        isActive={facts.openIsActive}
        isDirty={dirty}
        nextVersion={facts.nextVersion}
        canDiscard={canDelete && Boolean(publish.draftId)}
        onDiscard={publish.askToDiscard}
      />

      <BuilderProblems errors={errors} warnings={warnings} serverProblems={serverProblems} canvas={canvas} />

      <BuilderWorkspace
        canvas={
          <FlowCanvas
            state={state}
            fields={fields}
            ctx={ctx}
            editing={editing}
            clip={clip}
            className="lg:min-h-0 lg:overflow-y-auto"
          />
        }
        panel={
          <Inspector
            inspector={inspector}
            ctx={ctx}
            state={state}
            dispatch={dispatch}
            editing={editing}
            workflow={{ events, targetTypes, catalogsLoaded, notificationTypes, resolvedById, fields }}
            className="lg:min-h-0 lg:overflow-y-auto"
          />
        }
      />

      <CardMenu menu={menu.menu} onClose={menu.close} />

      <BuilderDialogs
        state={state}
        versions={versions}
        liveVersion={facts.liveVersion}
        editing={editing}
        save={save}
        publish={publish}
        reload={doc.reload}
      />
    </div>
  );
}

export default function WorkflowBuilderPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <BuilderContent />
    </Suspense>
  );
}
