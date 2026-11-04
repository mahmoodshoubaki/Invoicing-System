'use client';

import { motion } from 'motion/react';
import { SearchX, X } from 'lucide-react';

import Button from '@/components/common/Button';
import { CHROME } from '@/theme/vizPalette';

/** @param {{ filtered: boolean, onClear: () => void }} props */
export default function NoProjectsMatch({ filtered, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#dedcda] bg-white py-16 text-center"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f4f3f1]">
        <SearchX size={22} className="text-[#a1a1a0]" />
      </span>
      <div>
        <p className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
          {filtered ? 'No projects match your filters' : 'No projects yet'}
        </p>
        {filtered && (
          <p className="mt-1 text-xs" style={{ color: CHROME.textMuted }}>
            Try a different search term or clear the status filter.
          </p>
        )}
      </div>
      {filtered && (
        <Button variant="outline" size="sm" icon={X} onClick={onClear}>
          Clear filters
        </Button>
      )}
    </motion.div>
  );
}
