'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, Play, Radio } from 'lucide-react';

import Modal, { ConfirmModal } from '@/components/common/Modal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PublishDialog from '@/components/workflow/PublishDialog';
import DraftVersionRow from '@/components/workflow/DraftVersionRow';
import { publishedMessage, versionsWithRunsToMove } from '@/lib/publishImpact';
import { formatDateTime } from '@/utils/formatters';
import { withAlpha } from '@/utils/color';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { allow, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import {
  fetchDefinitionVersions,
  activateDefinition,
  discardDraft,
  fetchDefinitions,
  selectVersions,
  selectVersionsLoading,
} from '@/store/slices/workflowSlice';

/**
 * Version history for one workflow: its draft (2026-10-11), if any, and every
 * numbered version — one of which can be made live again from here.
 *
 * Publishing lives here rather than on the card because `GetDefinitions` only
 * carries `activeDefinitionId` — the id of what is *already* live. To activate
 * anything else you need that version's own `definitionId`, which only
 * `GetDefinitionVersions` returns. A "publish latest" button on the card would
 * have nothing to send.
 */
export default function VersionHistoryModal({ workflow, open, onClose }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { can } = usePermission();

  const versions = useSelector(selectVersions);
  const isLoading = useSelector(selectVersionsLoading);
  const canPublish = allow(can, WORKFLOW_PERMISSIONS.PUBLISH);
  const canManage = allow(can, WORKFLOW_PERMISSIONS.MANAGE);
  const canDelete = allow(can, WORKFLOW_PERMISSIONS.DELETE);

  const code = workflow?.code;

  // Which version the Publish button is waiting on. Publishing is one click
  // away from changing what every run follows — running ones included, since a
  // successful publish moves them all — and none of that is visible from the row.
  const [pendingPublish, setPendingPublish] = useState(null);
  const [publishing, setPublishing] = useState(false);
  // The runs that refused the last try (409 WF-024), listed in the dialog.
  const [blockedRuns, setBlockedRuns] = useState([]);
  const [discarding, setDiscarding] = useState(false);

  const draft = versions.find((v) => v.isDraft) ?? null;
  const numbered = versions.filter((v) => !v.isDraft);

  const liveVersion = versions.find((v) => v.isActive) ?? null;

  useEffect(() => {
    if (open && code) dispatch(fetchDefinitionVersions(code));
  }, [dispatch, open, code]);

  const handleActivate = useCallback(
    async () => {
      const version = pendingPublish;
      if (!version) return;

      // Read BEFORE publishing: afterwards the list is refetched and every run
      // is on the new version, so this is the only moment the answer is known.
      const runsMoved = versionsWithRunsToMove(versions, version).length > 0;

      setPublishing(true);
      const result = await dispatch(activateDefinition(version.definitionId));
      setPublishing(false);

      if (activateDefinition.rejected.match(result)) {
        // WF-024 lands here: a running workflow is in a stage that changed.
        // Nothing moved and the old version is still live, so the dialog stays
        // open and lists the runs in the way.
        if (result.payload?.blockedRuns?.length) {
          setBlockedRuns(result.payload.blockedRuns);
          return;
        }
        toast.error('Could not make this version live', result.payload?.message);
        return;
      }

      setPendingPublish(null);
      setBlockedRuns([]);
      // A successful publish always moved every running workflow — said as fact.
      toast.success(`Version ${version.version} is live`, publishedMessage(runsMoved));
      // Both lists move: this version becomes active and the previous one
      // stands down, so refetch rather than patching two rows by hand.
      dispatch(fetchDefinitionVersions(code));
      dispatch(fetchDefinitions());
    },
    [code, dispatch, pendingPublish, toast, versions]
  );

  const handleDiscard = useCallback(async () => {
    if (!draft) return;
    const result = await dispatch(discardDraft(draft.definitionId));
    setDiscarding(false);
    if (discardDraft.rejected.match(result)) {
      toast.error('Could not discard the draft', result.payload);
      return;
    }
    toast.success('Draft discarded', numbered.length ? 'The live version is not touched.' : 'It was never published, so the workflow is gone too.');
    dispatch(fetchDefinitions());
    if (numbered.length) dispatch(fetchDefinitionVersions(code));
    else onClose();
  }, [code, dispatch, draft, numbered.length, onClose, toast]);

  return (
    <Modal open={open} onClose={onClose} title={workflow ? `${workflow.name} — versions` : 'Versions'} size="lg">
      {isLoading && versions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : versions.length === 0 ? (
        <EmptyState title="No versions yet" message="Saving this workflow in the builder creates its draft; publishing makes version 1." />
      ) : (
        <ul className="flex flex-col gap-2" data-motion>
          {draft && (
            <DraftVersionRow
              code={code}
              row={draft}
              canManage={canManage}
              canDiscard={canDelete}
              onDiscard={() => setDiscarding(true)}
            />
          )}
          {numbered.map((version) => (
            <li
              key={version.definitionId}
              className="flex items-center gap-3 rounded-xl border p-3.5"
              style={{
                borderColor: version.isActive ? withAlpha(STATUS.good, 0.35) : '#f1f0ee',
                backgroundColor: version.isActive ? withAlpha(STATUS.good, 0.05) : 'transparent',
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
                    Version {version.version}
                  </span>

                  {version.isActive && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: withAlpha(STATUS.good, 0.12), color: STATUS.good }}
                    >
                      <Radio size={10} aria-hidden="true" />
                      Live
                    </span>
                  )}

                  {version.hasRunningInstances && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ backgroundColor: withAlpha(STATUS.info, 0.12), color: STATUS.info }}
                      title="Workflows are running on this version. Publishing another version moves them onto it."
                    >
                      <Play size={10} aria-hidden="true" />
                      In use
                    </span>
                  )}
                </div>

                {version.createdOn && (
                  <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
                    Saved {formatDateTime(version.createdOn)}
                  </p>
                )}
              </div>

              {version.isActive ? (
                <CheckCircle2 size={16} style={{ color: STATUS.good }} aria-hidden="true" />
              ) : (
                canPublish && (
                  <Button size="xs" variant="outline" onClick={() => { setBlockedRuns([]); setPendingPublish(version); }}>
                    Make live
                  </Button>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs leading-relaxed" style={{ color: CHROME.textMuted }}>
        Saving writes the draft; publishing it from the builder makes it the next version, live. An
        older version can be made live again here. Either way every running workflow moves onto it — or
        it is refused, with nothing moved, if one is waiting in a stage that changed.
      </p>

      <PublishDialog
        open={pendingPublish !== null}
        workflowName={workflow?.name}
        version={pendingPublish}
        liveVersion={liveVersion}
        versions={versions}
        blockedRuns={blockedRuns}
        busy={publishing}
        onClose={() => { setPendingPublish(null); setBlockedRuns([]); }}
        onConfirm={handleActivate}
      />

      <ConfirmModal
        open={discarding}
        title="Discard the draft?"
        message={numbered.length ? 'Everything in it is lost. The live version and every numbered version stay as they are.' : 'It was never published, so the whole workflow goes with it.'}
        confirmLabel="Discard draft"
        onClose={() => setDiscarding(false)}
        onConfirm={handleDiscard}
      />
    </Modal>
  );
}
