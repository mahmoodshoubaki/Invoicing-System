'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { fetchUnseenCount } from '@/store/slices/notificationsSlice';
import { usePolling } from '@/hooks/usePolling';
import { BELL_POLL_MS } from '@/constants/notifications';

/** Coming back to the window sooner than this does not ask again. */
const FOCUS_THROTTLE_MS = 10_000;

/**
 * Renderless — keeps the bell's badge current.
 *
 * There is no push (SignalR is not built), so the count is asked for every
 * minute while the tab is visible, at once when the tab becomes visible again
 * (usePolling does that), and when the window regains focus — someone who
 * switched apps for a while should not wait up to a minute to see what landed.
 *
 * One small number, never a list. Every signed-in user has a bell, so there is
 * no permission to check. Must be mounted inside the auth guard.
 */
export default function NotificationsSync() {
  const dispatch = useDispatch();
  const lastAsked = useRef(0);

  const load = useCallback(() => {
    lastAsked.current = Date.now();
    dispatch(fetchUnseenCount());
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  usePolling(load, BELL_POLL_MS, true);

  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - lastAsked.current > FOCUS_THROTTLE_MS) load();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  return null;
}
