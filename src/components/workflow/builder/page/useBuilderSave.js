'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';

import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes';
import { saveTarget } from '@/lib/workflowDrafts';
import { BuilderActions, editableSnapshot } from '@/lib/workflowBuilderState';
import { createDefinitionPayload } from '@/models/workflow';
import { fetchDefinitions, fetchDefinitionVersions, saveDefinition, selectVersions } from '@/store/slices/workflowSlice';

/** The server's own limits on what a save may carry; anything else saves, problems and all. */
const NAME_MAX = 200;
const DESCRIPTION_MAX = 500;

/**
 * Saving the workflow's draft (2026-10-11).
 *
 * A save never makes a version and is never blocked by problems: the server
 * saves the draft as it is and lists every problem with it. Those problems are
 * kept here, tied to the content they were found in — while nothing has been
 * edited since, they are what blocks a publish (see useBuilderPublish), and
 * they are drawn on the cards they are about.
 *
 * Saving something other than the draft — the live version, an older one —
 * makes it the draft. When a draft already exists that replaces it, so the
 * author is asked first (`pendingReplace`) and the save carries that draft's
 * stamp.
 *
 * @param {{
 *   state: Object, dirty: boolean, dispatch: Function,
 *   loadedKeyRef: { current: string|null },  moved on so the load effect does not refetch what was just saved
 *   onCodeAssigned: (code: string) => void,  a new workflow's first save gives it its code
 * }} options
 */
export function useBuilderSave({ state, dirty, dispatch, loadedKeyRef, onCodeAssigned }) {
  const router = useRouter();
  const dispatchRedux = useDispatch();
  const toast = useToast();
  const versions = useSelector(selectVersions);

  // Problems the server found, with the content they were found in.
  const [found, setFound] = useState(null);
  // The draft a save would replace, waiting for the author to confirm.
  const [pendingReplace, setPendingReplace] = useState(null);
  // A save refused because somebody else saved, published or discarded the draft (WF-052).
  const [stale, setStale] = useState(null);

  /**
   * The server's problems, while they still describe what is on screen:
   * nothing edited since they were found. Null when unknown — a draft opened
   * fresh has not been checked by the server yet, and an edit makes the last
   * list out of date.
   */
  const serverProblems = found && !dirty && found.snapshot === state.baseline ? found.problems : null;

  /** Keeps a problem list for the content on screen now — from a save, or a refused publish. */
  const rememberProblems = useCallback(
    (problems) => setFound({ problems, snapshot: state.baseline }),
    [state.baseline]
  );

  const save = useCallback(async ({ confirmed = false } = {}) => {
    const name = (state.name ?? '').trim();
    if (!name) {
      toast.error('Name it first', 'A workflow needs a name before it can be saved — on the Settings tab.');
      return;
    }
    if (name.length > NAME_MAX || (state.description ?? '').length > DESCRIPTION_MAX) {
      toast.error('Too long to save', `Keep the name under ${NAME_MAX} characters and the description under ${DESCRIPTION_MAX}.`);
      return;
    }

    const { stamp, replaces } = saveTarget(state, versions);
    if (replaces && !confirmed) {
      setPendingReplace(replaces);
      return;
    }
    setPendingReplace(null);

    const payload = createDefinitionPayload({
      code: state.code,
      stamp,
      name: state.name,
      description: state.description,
      targetTypeKey: state.targetTypeKey,
      trigger: state.trigger,
      variables: state.variables,
      graph: state.graph,
    });

    const result = await dispatchRedux(saveDefinition(payload));

    if (saveDefinition.rejected.match(result)) {
      const { message, status } = result.payload ?? {};
      if (status === 409) {
        setStale(message);
        return;
      }
      toast.error('Could not save', message);
      return;
    }

    const saved = result.payload;
    // Tied to the content as saved — MARK_SAVED stamps this same snapshot as the baseline.
    setFound({ problems: saved.problems, snapshot: editableSnapshot(state) });

    const count = saved.problems.length;
    if (count === 0) {
      toast.success('Draft saved', 'Nothing to fix — it can be published.');
    } else {
      toast.warning(
        `Draft saved with ${count} problem${count === 1 ? '' : 's'}`,
        'Fix them before publishing. They are listed at the top and marked on the canvas.'
      );
    }

    // A brand-new workflow only gets its code here, so the URL has to adopt it
    // or a refresh would land back on an empty builder. Without a version the
    // address opens the draft — which is what is on screen now.
    loadedKeyRef.current = `${saved.code}@`;
    if (!state.code) onCodeAssigned(saved.code);
    dispatch({ type: BuilderActions.MARK_SAVED, saved });
    router.replace(`${ROUTES.WORKFLOW_BUILDER}?code=${encodeURIComponent(saved.code)}`);
    dispatchRedux(fetchDefinitionVersions(saved.code));
    dispatchRedux(fetchDefinitions());
  }, [dispatch, dispatchRedux, loadedKeyRef, onCodeAssigned, router, state, toast, versions]);

  const handleSave = useCallback(() => save(), [save]);
  const confirmReplace = useCallback(() => save({ confirmed: true }), [save]);

  return {
    versions,
    serverProblems,
    rememberProblems,
    forgetProblems: () => setFound(null),
    handleSave,
    pendingReplace,
    confirmReplace,
    cancelReplace: () => setPendingReplace(null),
    stale,
    clearStale: () => setStale(null),
  };
}
