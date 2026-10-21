'use client';

import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/store/slices/uiSlice';

let toastId = 0;

/**
 * Fire-and-forget notifications.
 *
 * The returned object is memoised on `dispatch`, which react-redux keeps
 * stable for the life of the store — so it is created once per component and
 * never changes identity.
 *
 * That stability is load-bearing, not tidiness. This hook is almost always
 * used inside a `useCallback` that ends up as a prop on a memoised child:
 *
 *   const handleThing = useCallback(() => { … toast.error(…) }, [toast]);
 *
 * With a fresh object literal each render, `toast` changed every time, so
 * `handleThing` changed every time, so every `memo()` beneath it was defeated
 * — silently, since the app still behaves correctly and merely re-renders the
 * world. Memoising here fixes it once for every caller rather than making each
 * one work around it with a ref.
 */
export function useToast() {
  const dispatch = useDispatch();

  return useMemo(() => {
    const toast = ({ type = 'info', title, message, duration = 4000 }) => {
      dispatch(addToast({ id: ++toastId, type, title, message, duration }));
    };

    return {
      success: (title, message) => toast({ type: 'success', title, message }),
      error: (title, message) => toast({ type: 'error', title, message, duration: 10000 }),
      warning: (title, message) => toast({ type: 'warning', title, message, duration: 10000 }),
      info: (title, message) => toast({ type: 'info', title, message }),
      toast,
    };
  }, [dispatch]);
}

export default useToast;
