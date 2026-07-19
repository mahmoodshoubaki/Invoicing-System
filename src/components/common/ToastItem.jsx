'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { removeToast } from '@/store/slices/uiSlice';

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const ICON_STYLES = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

const BAR_STYLES = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

export default function ToastItem({ toast }) {
  const dispatch = useDispatch();
  const Icon = ICONS[toast.type] || Info;
  const duration = toast.duration || 4000;
  const [shrink, setShrink] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), duration);
    // Start the transition on the next frame so the browser paints the bar
    // at full width first — starting it in the same tick skips the animation.
    const raf = requestAnimationFrame(() => setShrink(true));
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [toast.id, duration, dispatch]);

  return (
    <div
      className={`
        relative overflow-hidden flex items-start gap-3 p-4 rounded-xl border shadow-lg min-w-72 max-w-sm
        animate-in slide-in-from-right-5 duration-300
        ${STYLES[toast.type] || STYLES.info}
      `}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${ICON_STYLES[toast.type]}`} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-semibold leading-tight">{toast.title}</p>}
        {toast.message && <p className="text-sm mt-0.5 opacity-80">{toast.message}</p>}
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
      <div
        className={`absolute bottom-0 left-0 h-1 opacity-60 ${BAR_STYLES[toast.type] || BAR_STYLES.info}`}
        style={{
          width: shrink ? '0%' : '100%',
          transitionProperty: 'width',
          transitionTimingFunction: 'linear',
          transitionDuration: `${duration}ms`,
        }}
      />
    </div>
  );
}
