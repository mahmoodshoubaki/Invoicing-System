'use client';

import { motion } from 'motion/react';
import { LayoutGrid, Rows3 } from 'lucide-react';

const OPTIONS = [
  { id: 'grid', label: 'Cards', icon: LayoutGrid },
  { id: 'table', label: 'Table', icon: Rows3 },
];

/** Cards or table. @param {{ view: 'grid'|'table', onChange: (view: string) => void }} props */
export default function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-[#f4f3f1] p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          aria-pressed={view === opt.id}
          className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === opt.id ? 'text-[#3c3c3a]' : 'text-[#898781] hover:text-[#52514e]'
          }`}
        >
          {view === opt.id && (
            <motion.span
              layoutId="projects-view-toggle"
              className="absolute inset-0 rounded-lg bg-white shadow-sm"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <opt.icon size={13} className="relative z-10" />
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
