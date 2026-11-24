'use client';

/**
 * @param {{ icon: import('react').ElementType, label: string, value: import('react').ReactNode, valueClass?: string }} props
 */
export default function InfoItem({ icon: Icon, label, value, valueClass = '' }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-sm text-gray-800 mt-0.5 ${valueClass}`}><span dir="auto">{value || '—'}</span></p>
      </div>
    </div>
  );
}
