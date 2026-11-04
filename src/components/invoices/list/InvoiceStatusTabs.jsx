'use client';

/**
 * @param {{ statuses: Array<{ id: number, label: string }>, value: number|null, onChange: (id: number|null) => void }} props
 */
export default function InvoiceStatusTabs({ statuses, value, onChange }) {
  const tabs = [{ id: null, label: 'All' }, ...statuses];
  return (
    <div role="tablist" aria-label="Invoice status" className="mb-5 flex w-fit flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id ?? 'all'}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`press-flat rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              active ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
