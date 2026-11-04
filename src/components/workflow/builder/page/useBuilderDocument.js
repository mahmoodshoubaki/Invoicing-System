'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
  BuilderActions, emptyDefinition, emptyHistory, HistoryActions, historyReducer, isDirty,
} from '@/lib/workflowBuilderState';
import { fetchAllRoles } from '@/store/slices/rolesSlice';
import { fetchGroups } from '@/store/slices/groupsSlice';
import {
  fetchApiDomains, fetchBuilderCatalogs, fetchDefinition, fetchDefinitionVersions,
} from '@/store/slices/workflowSlice';
import { isTypingIn } from './keyboard';

/**
 * @param {{ code: string|null, versionParam: string|null }} options
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

  const loadedKeyRef = useRef(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    dispatchRedux(fetchBuilderCatalogs());
    dispatchRedux(fetchAllRoles());
    dispatchRedux(fetchGroups());
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
      loadedKeyRef.current = key;
      dispatch({ type: BuilderActions.LOADED, definition: result.payload });
    })();

    return () => { cancelled = true; };
  }, [code, versionParam, dispatchRedux, reloadToken]);

  const reload = useCallback(() => {
    loadedKeyRef.current = null;
    setReloadToken((n) => n + 1);
    if (code) dispatchRedux(fetchDefinitionVersions(code));
  }, [code, dispatchRedux]);

  const dirty = isDirty(state);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;

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
