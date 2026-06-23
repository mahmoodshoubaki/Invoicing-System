'use client';

import { useSelector } from 'react-redux';
import ToastItem from './ToastItem';

export default function ToastContainer() {
  const toasts = useSelector((s) => s.ui.toasts);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
