'use client';

import { ConfirmModal } from '@/components/common/Modal';
import PublishDialog from '@/components/workflow/PublishDialog';
import { formatDateTime } from '@/utils/formatters';
import { hasPublishedOrSavedVersions } from '@/lib/workflowDrafts';

/** "the unpublished draft from Sara, 10/10/2026, 10:42" */
function describeDraft(row) {
  if (!row) return 'the unpublished draft';
  const who = row.savedByName ? ` from ${row.savedByName}` : '';
  const when = row.savedOn ? `, ${formatDateTime(row.savedOn)}` : '';
  return `the unpublished draft${who}${when}`;
}

/**
 * Every question the builder asks before it acts: deleting nested work,
 * going live, replacing somebody's draft, discarding the draft, and what to
 * do when somebody else saved first.
 *
 * @param {{
 *   state: Object, versions: Array, liveVersion: Object|null,
 *   editing: ReturnType<import('./useBuilderEditing').useBuilderEditing>,
 *   save: ReturnType<import('./useBuilderSave').useBuilderSave>,
 *   publish: ReturnType<import('./useBuilderPublish').useBuilderPublish>,
 *   reload: () => void,
 * }} props
 */
export default function BuilderDialogs({ state, versions, liveVersion, editing, save, publish, reload }) {
  const draftOnly = !hasPublishedOrSavedVersions(versions);

  return (
    <>
      {/* Only the deletions that take nested work with them get a dialog.
          Everything smaller is covered by Ctrl+Z, which is cheaper than a
          prompt for a mistake that costs one click to undo. */}
      <ConfirmModal
        open={editing.pendingDelete !== null}
        title={editing.pendingDelete?.title}
        message={editing.pendingDelete?.message}
        confirmLabel={editing.pendingDelete?.confirmLabel}
        onClose={editing.cancelDelete}
        onConfirm={editing.confirmDelete}
      />

      <PublishDialog
        open={publish.pending !== null}
        workflowName={state.name}
        version={publish.pending?.version}
        fromDraft={publish.pending?.kind === 'draft'}
        liveVersion={liveVersion}
        versions={versions}
        blockedRuns={publish.blockedRuns}
        busy={publish.busy}
        onClose={publish.cancel}
        onConfirm={publish.confirm}
      />

      <ConfirmModal
        open={save.pendingReplace !== null}
        title="Replace the draft?"
        message={`Saving version ${state.version} makes it the draft, replacing ${describeDraft(save.pendingReplace)}. Whatever is in that draft is lost.`}
        confirmLabel="Replace the draft"
        onClose={save.cancelReplace}
        onConfirm={save.confirmReplace}
      />

      <ConfirmModal
        open={publish.askingToDiscard}
        title="Discard the draft?"
        message={
          draftOnly
            ? 'It was never published, so the whole workflow goes with it.'
            : 'Everything in it is lost. The live version and every numbered version stay as they are.'
        }
        confirmLabel="Discard draft"
        loading={publish.busy}
        onClose={publish.cancelDiscard}
        onConfirm={publish.confirmDiscard}
      />

      <ConfirmModal
        open={save.stale !== null}
        title="Somebody else changed this draft"
        message={`${save.stale ?? ''} Reloading shows what is there now — the changes on this screen are lost.`}
        confirmLabel="Reload"
        confirmVariant="primary"
        onClose={save.clearStale}
        onConfirm={() => {
          save.clearStale();
          reload();
        }}
      />
    </>
  );
}
