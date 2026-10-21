'use client';

import { useCallback, useEffect, useState } from 'react';

import { changeRequestRepository } from '@/repositories/changeRequestRepository';
import { isOpenChangeRequest } from '@/constants/changeRequests';

const NONE = [];

/**
 * A BOQ's change requests (2026-10-19) — GetChangeRequestsByBoqId, which
 * ChangeRequests.View reads. `enabled` is false without it, or before the BOQ
 * is known: then nothing is asked.
 *
 * @param {string|null} boqId
 * @param {boolean} enabled
 */
export function useBoqChangeRequests(boqId, enabled) {
  const [loaded, setLoaded] = useState({ boqId: null, rows: NONE, error: null });
  const [token, setToken] = useState(0);

  useEffect(() => {
    if (!enabled || !boqId) return undefined;
    let cancelled = false;
    changeRequestRepository.getChangeRequestsByBoqId(boqId)
      .then((rows) => { if (!cancelled) setLoaded({ boqId, rows, error: null }); })
      .catch((err) => { if (!cancelled) setLoaded({ boqId, rows: NONE, error: err?.message || 'Could not load the change requests.' }); });
    return () => { cancelled = true; };
  }, [boqId, enabled, token]);

  const reload = useCallback(() => setToken((n) => n + 1), []);
  const ready = !enabled || !boqId || loaded.boqId === boqId;
  const rows = loaded.boqId === boqId ? loaded.rows : NONE;

  return {
    ready,
    rows,
    error: loaded.boqId === boqId ? loaded.error : null,
    // Only one may be open on a BOQ at a time.
    open: rows.find((r) => isOpenChangeRequest(r.statusId)) ?? null,
    reload,
  };
}
