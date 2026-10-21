'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { workflowRepository } from '@/repositories/workflowRepository';
import { fetchFields } from '@/store/slices/workflowSlice';
import {
  applyEdit, changedRows, currentRow, mergeSavedRows, rowProblem, splitFieldErrors,
} from '@/lib/fieldSettingsDraft';

export const FIELD_PAGE_SIZE = 10;

/** How long typing pauses before the search is sent. */
const SEARCH_DELAY_MS = 300;

const NO_ROWS = [];

/**
 * One kind of thing's fields on the Workflow fields page (2026-10-13): a page
 * at a time from the server (search, skip, take), the admin's edits, and saving
 * the changed rows.
 *
 * Edits are kept by field name with the row as loaded, so they survive paging
 * and searching, and Save sends every changed row wherever it is. The save
 * answers with those rows only; they are put in place on the page shown.
 *
 * After a save the builder's own copy of the field list is fetched again, so a
 * label renamed here reads the new way in the builder without a reload.
 *
 * @param {number} targetTypeKey
 */
export function useFieldSettings(targetTypeKey) {
  const dispatch = useDispatch();
  const [query, setQueryText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // Rows a page, as the reader chooses (2026-10-21).
  const [pageSize, setPageSizeValue] = useState(FIELD_PAGE_SIZE);
  const [loaded, setLoaded] = useState({ key: null, rows: NO_ROWS, total: 0, error: null });
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState({ byName: {}, other: [] });
  const [token, setToken] = useState(0);

  // The search goes to the server once typing pauses, and starts at page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const key = `${targetTypeKey}|${search}|${page}|${pageSize}`;

  useEffect(() => {
    let cancelled = false;
    workflowRepository
      .getFieldSettings({ targetTypeKey, search, skip: (page - 1) * pageSize, take: pageSize })
      .then(({ rows, total }) => { if (!cancelled) setLoaded({ key, rows, total, error: null }); })
      .catch((err) => {
        if (!cancelled) setLoaded({ key, rows: NO_ROWS, total: 0, error: err?.message || 'Could not load the fields.' });
      });
    return () => { cancelled = true; };
  }, [key, targetTypeKey, search, page, pageSize, token]);

  const ready = loaded.key === key;
  const loadedRows = ready ? loaded.rows : NO_ROWS;
  const rows = useMemo(() => loadedRows.map((r) => currentRow(r, edits)), [loadedRows, edits]);
  const changed = useMemo(() => changedRows(edits), [edits]);
  const problems = useMemo(
    () => Object.fromEntries(changed.map((r) => [r.name, rowProblem(r)]).filter(([, p]) => p)),
    [changed]
  );
  const changedNames = useMemo(() => new Set(changed.map((r) => r.name)), [changed]);

  const edit = useCallback((name, patch) => {
    const row = loaded.rows.find((r) => r.name === name);
    if (!row) return;
    setEdits((prev) => applyEdit(prev, row, patch));
    // A changed row answers its own refusal.
    setServerErrors((prev) => {
      if (!prev.byName[name]) return prev;
      const byName = { ...prev.byName };
      delete byName[name];
      return { ...prev, byName };
    });
  }, [loaded.rows]);

  const discard = useCallback(() => {
    setEdits({});
    setServerErrors({ byName: {}, other: [] });
  }, []);

  const save = useCallback(async () => {
    if (changed.length === 0 || Object.keys(problems).length > 0) return false;
    setSaving(true);
    setServerErrors({ byName: {}, other: [] });
    try {
      const saved = await workflowRepository.saveFieldSettings(targetTypeKey, changed);
      setLoaded((prev) => ({ ...prev, rows: mergeSavedRows(prev.rows, saved) }));
      setEdits({});
      dispatch(fetchFields(targetTypeKey));
      return true;
    } catch (err) {
      const names = [...new Set([...changed.map((r) => r.name), ...loaded.rows.map((r) => r.name)])];
      const split = splitFieldErrors(err?.errors, names);
      if (!Object.keys(split.byName).length && !split.other.length) split.other.push(err?.message || 'Could not save.');
      setServerErrors(split);
      return false;
    } finally {
      setSaving(false);
    }
  }, [changed, dispatch, loaded.rows, problems, targetTypeKey]);

  const setQuery = useCallback((text) => setQueryText(text), []);
  // A new size starts at page 1.
  const setPageSize = useCallback((next) => {
    setPageSizeValue(next);
    setPage(1);
  }, []);
  // "Show" on a problem out of sight: search straight for it, without the pause.
  const showField = useCallback((name) => {
    setQueryText(name);
    setSearch(name);
    setPage(1);
  }, []);

  return {
    ready,
    error: ready ? loaded.error : null,
    rows,
    // The last count stays while the next page loads, so the pager does not flicker.
    total: loaded.total,
    page,
    setPage,
    pageSize,
    setPageSize,
    query,
    setQuery,
    showField,
    changed,
    changedNames,
    problems,
    serverErrors,
    saving,
    edit,
    discard,
    save,
    reload: () => setToken((n) => n + 1),
  };
}
