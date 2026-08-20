'use client';

/**
 * Was previously declared inline inside ProjectDetailPage's render body —
 * React treats a component defined inside another component's function as a
 * brand-new type on every parent re-render, so it was fully unmounting and
 * remounting on every click instead of just updating. Living in its own
 * module gives it a stable identity across renders.
 */
export default function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800">{value || '—'}</span>
    </div>
  );
}
