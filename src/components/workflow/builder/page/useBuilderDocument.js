'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
  BuilderActions, emptyDefinition, emptyHistory, HistoryActions, historyReducer, isDirty,
} from '@/lib/workflowBuilderState';
import { fetchAllRoles } from '@/store/slices/rolesSlice';
import {
  fetchApiDomains, fetchBuilderCatalogs, fetchDefinition, fetchDefinitionVersions,
} from '@/store/slices/workflowSlice';
import { isTypingIn } from './keyboard';

/**
 * The definition being edited, wrapped in an undo stack — and everything that
 * loads it, guards it, and steps back and forward through it.
 *
 * `history.present` is the definition every panel reads; the stack itself is
 * only touched by Ctrl+Z / Y and the Undo / Redo buttons.
 *
 * @param {{ code: string|null, versionParam: string|null }} options  from the URL
 */
export function useBuilderDocument({ code, versionParam }) {
  const dispatchRedux = useDispatch();
  const [history, dispatch] = useReducer(
    historyReducer,
    undefined,
    () => emptyHistory(emptyDefinition())
  );
  const state = history.present;
  const [loadError, setLoadError] = useState(null);

  // Guards the load effect against re-running for a query string it already
  // handled, which would throw away edits in progress. A save moves it on too.
  const loadedKeyRef = useRef(null);
  // Bumped to load the same address again on purpose — after a save refused
  // because somebody else saved first, or after the draft was discarded.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    dispatchRedux(fetchBuilderCatalogs());
    // Roles fill the humanTask assignee picker; approved hosts let the http.call
    // URL field warn at design time instead of the run failing later.
    dispatchRedux(fetchAllRoles());
    dispatchRedux(fetchApiDomains(true));
  }, [dispatchRedux]);

  useEffect(() => {
    if (code) dispatchRedux(fetchDefinitionVersions(code));
  }, [dispatchRedux, code]);

  useEffect(() => {
    const key = `${code ?? ''}@${versionParam ?? ''}`;
    if (loadedKeyRef.current === key) return undefined;

    if (!code) {
      loadedKeyRef.current = key;
      dispatch({ type: BuilderActions.RESET });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      const result = await dispatchRedux(
        fetchDefinition({ code, version: versionParam ? Number(versionParam) : null })
      );
      if (cancelled) return;

      if (fetchDefinition.rejected.match(result)) {
        setLoadError(result.payload);
        return;
      }

      setLoadError(null);
      /*
       * Stamped only now that the load has ACTUALLY landed.
       *
       * Stamping it before the await made this effect a no-op in development:
       * Strict Mode runs an effect twice, so the first pass claimed the key and
       * started the fetch, the cleanup cancelled it, and the second pass saw
       * its own key already claimed and returned without fetching anything. The
       * result was an empty builder on every "open in builder" — no name, no
       * stages, and a validator quite correctly complaining the name was blank.
       *
       * Claiming it here costs one duplicate GET under Strict Mode (the first
       * is cancelled, the second wins) and nothing in production.
       */
      loadedKeyRef.current = key;
      // LOADED also stamps the clean baseline, so the dirty flag measures the
      // author's edits rather than any difference between load and mapping.
      dispatch({ type: BuilderActions.LOADED, definition: result.payload });
    })();

    return () => { cancelled = true; };
  }, [code, versionParam, dispatchRedux, reloadToken]);

  /** Loads what is at this address again, dropping any edits — the caller has asked first. */
  const reload = useCallback(() => {
    loadedKeyRef.current = null;
    setReloadToken((n) => n + 1);
    if (code) dispatchRedux(fetchDefinitionVersions(code));
  }, [code, dispatchRedux]);

  const dirty = isDirty(state);

  // Browsers only show their own generic message here, but the prompt itself is
  // what matters: the builder holds the only copy of unsaved work.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  /*
   * Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, unless the caret is in a field.
   *
   * A text input has its own undo stack that the browser maintains, and
   * hijacking Ctrl+Z there would take a whole stage away when the author only
   * wanted the last word back. So the shortcut steps aside while a field has
   * focus, and the document-level history takes over everywhere else.
   */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;

      // A tick box keeps focus after it is clicked, and is not a field with an
      // undo of its own — so it must not swallow Ctrl+Z.
      if (isTypingIn(document.activeElement)) return;

      e.preventDefault();
      const redo = key === 'y' || (key === 'z' && e.shiftKey);
      dispatch({ type: redo ? HistoryActions.REDO : HistoryActions.UNDO });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const onUndo = useCallback(() => dispatch({ type: HistoryActions.UNDO }), []);
  const onRedo = useCallback(() => dispatch({ type: HistoryActions.REDO }), []);

  return {
    state, dispatch, dirty, loadError, loadedKeyRef, reload,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    onUndo, onRedo,
  };
}
