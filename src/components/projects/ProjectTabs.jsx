'use client';

import { memo } from 'react';

export const PROJECT_TABS = ['Overview', 'EPM Sub-Projects', 'BOQ', 'Invoices'];

/**
 * Controlled tab nav — a pure function of `activeTab`, so switching tabs
 * only re-renders this and whichever tab panel is now active, not the
 * stat cards or other panels above/below it.
 */
function ProjectTabs({ activeTab, onChange }) {
  return (
    <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
      {PROJECT_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === tab
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default memo(ProjectTabs);
