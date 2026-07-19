'use client';

import { useDispatch } from 'react-redux';
import { addToast } from '@/store/slices/uiSlice';

let toastId = 0;

export function useToast() {
  const dispatch = useDispatch();

  const toast = ({ type = 'info', title, message, duration = 4000 }) => {
    dispatch(addToast({ id: ++toastId, type, title, message, duration }));
  };

  return {
    success: (title, message) => toast({ type: 'success', title, message }),
    error: (title, message) => toast({ type: 'error', title, message, duration: 10000 }),
    warning: (title, message) => toast({ type: 'warning', title, message }),
    info: (title, message) => toast({ type: 'info', title, message }),
    toast,
  };
}
