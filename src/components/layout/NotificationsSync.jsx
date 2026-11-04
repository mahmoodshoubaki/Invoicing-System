'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { fetchUnseenCount } from '@/store/slices/notificationsSlice';
import { usePolling } from '@/hooks/usePolling';
import { BELL_POLL_MS } from '@/constants/notifications';

const FOCUS_THROTTLE_MS = 10_000;

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
