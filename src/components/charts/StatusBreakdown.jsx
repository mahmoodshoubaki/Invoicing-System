'use client';

import { motion } from 'motion/react';
import { CHROME } from '@/theme/vizPalette';

/**
 * @param {{data: Array<{name: string, value: number, color: string, icon: Function, detail?: string}>}} props
 */
export default function StatusBreakdown({ data = [] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(...data.map((d) => d.value), 1);
  const ranked = [...data].sort((a, b) => b.value - a.value);

  if (total === 0) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: CHROME.textMuted }}>
        No invoices to break down yet.
      </p>
    );
  }

  return (
    <motion.ul
      data-motion
      className="flex flex-col gap-3.5"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {ranked.map((item) => {
        const Icon = item.icon;
        const pct = Math.round((item.value / total) * 100);
        return (
          <motion.li
            key={item.name}
            variants={{
              hidden: { opacity: 0, x: -8 },
              show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            <div className="mb-1.5 flex items-center gap-2">
              {Icon && (
                <Icon size={13} style={{ color: item.color }} aria-hidden="true" className="shrink-0" />
              )}
              <span className="flex-1 text-xs font-medium" style={{ color: CHROME.textSecondary }}>
                {item.name}
                {item.detail && <span className="ml-1.5 font-normal tabular-nums" style={{ color: CHROME.textMuted }}>{item.detail}</span>}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{ color: CHROME.textPrimary }}>
                {item.value}
              </span>
              <span className="w-9 text-right text-xs tabular-nums" style={{ color: CHROME.textMuted }}>
                {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#f1f0ee]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(item.value / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
