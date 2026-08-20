'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { FileText, LayoutList, Network, PieChart } from 'lucide-react';

export const PROJECT_TABS = ['Overview', 'EPM Sub-Projects', 'BOQ', 'Invoices'];

const TAB_ICONS = {
  Overview: PieChart,
  'EPM Sub-Projects': Network,
  BOQ: LayoutList,
  Invoices: FileText,
};

/**
 * Controlled tab nav — a pure function of `activeTab`, so switching tabs
 * only re-renders this and whichever tab panel is now active, not the
 * stat cards or hero above it.
 *
 * The active pill is a single shared element animated between tabs via
 * layoutId, rather than four elements cross-fading — so it physically slides.
 */
function ProjectTabs({ activeTab, onChange, counts = {} }) {
  return (
    <div className="mb-5 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-[#f4f3f1] p-1.5">
      {PROJECT_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab];
        const active = activeTab === tab;
        const count = counts[tab];

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            aria-pressed={active}
            className={`relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              active ? 'text-[#3c3c3a]' : 'text-[#898781] hover:text-[#52514e]'
            }`}
          >
            {active && (
              <motion.span
                layoutId="project-tab-pill"
                className="absolute inset-0 rounded-xl bg-white shadow-[0_2px_8px_-2px_rgb(60_60_58/0.15)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <Icon size={14} className="relative z-10" />
            <span className="relative z-10 whitespace-nowrap">{tab}</span>
            {count != null && (
              <span
                className={`relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-colors ${
                  active ? 'bg-[#f8485e] text-white' : 'bg-[#e6e4e2] text-[#898781]'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default memo(ProjectTabs);
