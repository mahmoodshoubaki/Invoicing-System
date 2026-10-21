'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';

import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { publishedMessage, versionsWithRunsToMove } from '@/lib/publishImpact';
import { draftIdOf, hasPublishedOrSavedVersions, nextVersionNumber } from '@/lib/workflowDrafts';
import { BuilderActions } from '@/lib/workflowBuilderState';
import {
  activateDefinition, discardDraft, fetchDefinitions, fetchDefinitionVersions, publishDefinition,
} from '@/store/slices/workflowSlice';

/** WF-053: the draft still has problems. WF-054: there is no draft. */
const HAS_PROBLEMS = 'WF-053';
const NO_DRAFT = 'WF-054';

/**
 * Making things live from the builder (2026-10-11), and throwing the draft away.
 *
 *   publish the draft   PublishDefinition — it becomes the next version, live
 *   make vN live        ActivateDefinition — going back to an older version
 *   discard the draft   DeleteDefinition with the draft's id
 *
 * Both ways of going live confirm first (`pending`) with what they will do to
 * running workflows, and both can be refused 409 WF-024 by runs waiting in a
 * stage that changed — those are kept (`blockedRuns`) and the dialog stays open
 * to list them. A publish refused for problems (WF-053) hands its list to the
 * save hook, which shows it like a save's.
 *
 * @param {{
 *   state: Object, dispatch: Function, versions: Array,
 *   save: ReturnType<import('./useBuilderSave').useBuilderSave>,
 *   reload: () => void,
 * }} options
 */
export function useBuilderPublish({ state, dispatch, versions, save, reload }) {
  const router = useRouter();
  const dispatchRedux = useDispatch();
  const toast = useToast();

  // { kind: 'draft', version: { version } } | { kind: 'version', version: row }
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [blockedRuns, setBlockedRuns] = useState([]);
  const [askingToDiscard, setAskingToDiscard] = useState(false);

  const { rememberProblems, forgetProblems } = save;

  const refresh = useCallback(() => {
    dispatchRedux(fetchDefinitionVersions(state.code));
    dispatchRedux(fetchDefinitions());
  }, [dispatchRedux, state.code]);

  const askToPublishDraft = useCallback(() => {
    setBlockedRuns([]);
    setPending({ kind: 'draft', version: { version: nextVersionNumber(versions) } });
  }, [versions]);

  const askToActivate = useCallback((row) => {
    setBlockedRuns([]);
    setPending({ kind: 'version', version: row });
  }, []);

  const cancel = useCallback(() => {
    setPending(null);
    setBlockedRuns([]);
  }, []);

  /** What a refusal means for the screen. True when the dialog should stay open. */
  const refused = useCallback((refusal, what) => {
    if (refusal?.status === 409 && refusal.blockedRuns?.length) {
      setBlockedRuns(refusal.blockedRuns);
      return true;
    }
    if (refusal?.code === HAS_PROBLEMS) {
      rememberProblems(refusal.problems ?? []);
      const n = refusal.problems?.length ?? 0;
      toast.error(`${n} problem${n === 1 ? '' : 's'} to fix first`, 'They are listed at the top and marked on the canvas.');
      return false;
    }
    if (refusal?.code === NO_DRAFT) {
      toast.error('There is no draft to publish', 'It was published or discarded somewhere else. Reloading shows what is there now.');
      reload();
      return false;
    }
    toast.error(`Could not ${what}`, refusal?.message);
    return false;
  }, [rememberProblems, reload, toast]);

  const confirm = useCallback(async () => {
    if (!pending) return;
    // Read BEFORE going live — afterwards every run is on the new version, so
    // this is the only moment the answer is known.
    const runsMoved = versionsWithRunsToMove(versions, pending.version).length > 0;

    setBusy(true);
    if (pending.kind === 'draft') {
      const result = await dispatchRedux(publishDefinition(state.code));
      setBusy(false);
      if (publishDefinition.rejected.match(result)) {
        if (!refused(result.payload, 'publish')) cancel();
        return;
      }
      cancel();
      forgetProblems();
      dispatch({ type: BuilderActions.MARK_PUBLISHED, published: result.payload });
      toast.success(`Version ${result.payload.version} is live`, publishedMessage(runsMoved));
      refresh();
      return;
    }

    const result = await dispatchRedux(activateDefinition(pending.version.definitionId));
    setBusy(false);
    if (activateDefinition.rejected.match(result)) {
      if (!refused(result.payload, 'make it live')) cancel();
      return;
    }
    cancel();
    toast.success(`Version ${pending.version.version} is live`, publishedMessage(runsMoved));
    refresh();
  }, [cancel, dispatch, dispatchRedux, forgetProblems, pending, refresh, refused, state.code, toast, versions]);

  const draftId = draftIdOf(state, versions);

  const confirmDiscard = useCallback(async () => {
    if (!draftId) return;
    setBusy(true);
    const result = await dispatchRedux(discardDraft(draftId));
    setBusy(false);
    setAskingToDiscard(false);
    if (discardDraft.rejected.match(result)) {
      toast.error('Could not discard the draft', result.payload);
      return;
    }
    forgetProblems();
    dispatchRedux(fetchDefinitions());

    // A workflow that only ever had a draft is gone with it.
    if (!hasPublishedOrSavedVersions(versions)) {
      toast.success('Draft discarded', 'It was never published, so the workflow is gone too.');
      router.push(ROUTES.WORKFLOW);
      return;
    }
    toast.success('Draft discarded', 'Showing the live version.');
    router.replace(`${ROUTES.WORKFLOW_BUILDER}?code=${encodeURIComponent(state.code)}`);
    reload();
  }, [dispatchRedux, draftId, forgetProblems, reload, router, state.code, toast, versions]);

  return {
    pending,
    busy,
    blockedRuns,
    askToPublishDraft,
    askToActivate,
    cancel,
    confirm,
    draftId,
    askingToDiscard,
    askToDiscard: () => setAskingToDiscard(true),
    cancelDiscard: () => setAskingToDiscard(false),
    confirmDiscard,
  };
}
